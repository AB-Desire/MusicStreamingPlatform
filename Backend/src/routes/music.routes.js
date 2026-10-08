const express = require('express');
const musicController = require('../controllers/music.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    }
});

const router = express.Router();

// Artist Studio routes (RBAC - Artist role only)
router.post("/upload", authMiddleware.authArtist, upload.single("music"), musicController.createMusic);
router.post("/album", authMiddleware.authArtist, musicController.createAlbum);
router.get("/artist/tracks", authMiddleware.authArtist, musicController.getArtistTracks);
router.get("/artist/albums", authMiddleware.authArtist, musicController.getArtistAlbums);
router.delete("/:id", authMiddleware.authArtist, musicController.deleteMusic);

// Streaming & Catalog routes (Accessible to both listeners and artists)
router.get("/", authMiddleware.authOptional, musicController.getAllMusics);
router.get("/albums", authMiddleware.authOptional, musicController.getAllAlbums);
router.get("/albums/:albumId", authMiddleware.authOptional, musicController.getAlbumById);
router.post("/:id/play", musicController.playTrack);
router.get("/:id", authMiddleware.authOptional, musicController.getMusicById);

module.exports = router;