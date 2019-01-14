import {
  Handler,
  APIGatewayProxyHandler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult
} from "aws-lambda";
import { Box } from "./utils/box";
import * as documentProperties from "office-document-properties-with-custom";
import { FilesReader, SkillsWriter, SkillsErrorEnum } from "./skills-kit-2.0";

type APIGatewayProxyBoxSkillHandler = Handler<
  APIGatewayProxyBoxSkillEvent,
  APIGatewayProxyBoxSkillResult | void
>;
type APIGatewayProxyBoxSkillEvent = APIGatewayProxyEvent & { body: string };
type APIGatewayProxyBoxSkillResult = APIGatewayProxyResult;

export const handler: APIGatewayProxyBoxSkillHandler = async (
  event,
  context,
  callback
) => {
  const { body } = event;
  const filesReader = new FilesReader(body);
  const skillsWriter = new SkillsWriter(filesReader.getFileContext());

  if (isValidEvent(event)) {
    skillsWriter.saveProcessingCard();
    processEvent(filesReader, skillsWriter);
  } else {
    skillsWriter.saveErrorCard(SkillsErrorEnum.INVALID_EVENT);
    callback(null, { statusCode: 200, body: "Event received but invalid" });
  }
  //Callback to end request
  callback(null, { statusCode: 200, body: "event is processed by skill" });
};

function isValidEvent(triggeredEvent) {
  return triggeredEvent.body;
}

async function processEvent(filesReader, skillsWriter) {
  const box = new Box(filesReader, skillsWriter);

  documentProperties.provideCustomPropertiesSettings([
    {
      name: "status",
      msName: "Status",
      type: "string"
    }
  ]);

  try {
    const tempFilePath = await box.downloadFileFromBox();

    const extractedMetadata = await extractDocumentProperties(tempFilePath);

    await box.attachMetadataCard(extractedMetadata);
    console.log("Successfully attached Skills metadata to Box file");
  } catch (error) {
    skillsWriter.saveErrorCard(SkillsErrorEnum.UNKNOWN);
  }
}

async function extractDocumentProperties(filePath) {
  return new Promise((resolve, reject) => {
    documentProperties.fromFilePath(filePath, (err, data) => {
      err ? reject(err) : resolve(data);
    });
  });
}
