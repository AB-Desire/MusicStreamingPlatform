const { ImageKit } = require('@imagekit/nodejs');

const ImageKitClient = new ImageKit({
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY
});

async function uploadFile(file, originalName = '') {
    const cleanPrefix = (originalName ? originalName.replace(/[^a-zA-Z0-9_-]/g, "_") : "music");
    const result = await ImageKitClient.files.upload({
        file,
        fileName: `${cleanPrefix}_${Date.now()}`,
        folder: "yt-complete-backend/music"
    });

    return result;
}

module.exports = { uploadFile };