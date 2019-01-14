import * as fs from "fs";

const TEMP_PATH = "/tmp/box-file.bin";

export class Box {
  constructor(private filesReader, private skillsWriter) {}

  /**
   * Download Document from Box using the Skills Kit FilesReader class.
   */
  async downloadFileFromBox() {
    // get box file read stream and write to local temp file
    const readStream = await this.filesReader.getContentStream();
    const writeStream = fs.createWriteStream(TEMP_PATH);
    const stream = readStream.pipe(writeStream);

    // wait for stream write to 'finish'
    await new Promise((resolve, reject) => {
      stream.on("finish", function() {
        resolve();
      });
    });

    return TEMP_PATH;
  }

  /**
   * Attach skills metadata to file using the Skills Kit skillsWriter class.
   */
  async attachMetadataCard(extractedMetadata) {
    // office properties information card
    const metadataDetails = returnCard(
      "MS Office Properties",
      extractedMetadata,
      {
        company: "Company",
        status: "Status",
        subject: "Subject",
        title: "title",
        keywords: "Keywords"
      }
    );

    const transcriptJSON = this.skillsWriter.createTranscriptsCard(
      metadataDetails
    );
    this.skillsWriter.saveDataCards([transcriptJSON]);
  }
}

/**
 * Helper function to format Skills metadata card.
 *
 * @param {Object} keywordTitle - title of box skill metadata card
 * @param {Object} extractedMetadata - all extracted metadata
 * @param {Object} properties - target keywords
 */
function returnCard(keywordTitle, extractedMetadata, properties) {
  const entries = [];

  // push metadata to cardTemplate entries
  Object.keys(properties).forEach(key => {
    if (extractedMetadata[key]) {
      entries.push({
        // type: "text",
        text: `${properties[key]}: ${extractedMetadata[key]}`
      });
    }
  });

  return entries;
}
