const musicModel = require('../models/music.model');
const albumModel = require('../models/album.model');
const { uploadFile } = require('../services/storage.service');

async function createMusic(req, res) {
    try {
        const { title, genre = 'Electronic', coverImage = '', duration = '03:20' } = req.body;
        const file = req.file;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Track title is required" });
        }

        if (!file) {
            return res.status(400).json({ message: "Audio file is required" });
        }

        // Upload audio buffer to ImageKit
        const result = await uploadFile(file.buffer.toString('base64'), file.originalname);

        const music = await musicModel.create({
            uri: result.url,
            title: title.trim(),
            artist: req.user.id,
            genre: genre.trim(),
            coverImage: coverImage.trim(),
            duration: duration.trim(),
            plays: 0
        });

        const populatedMusic = await musicModel.findById(music._id).populate("artist", "username email role");

        return res.status(201).json({
            message: "Track uploaded successfully",
            music: populatedMusic
        });
    } catch (error) {
        console.error("createMusic error:", error);
        return res.status(500).json({ message: "Failed to upload track", error: error.message });
    }
}

async function createAlbum(req, res) {
    try {
        const { title, musics = [], description = '', coverImage = '', genre = 'Various' } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Album title is required" });
        }

        const album = await albumModel.create({
            title: title.trim(),
            artist: req.user.id,
            musics: Array.isArray(musics) ? musics : [musics],
            description: description.trim(),
            coverImage: coverImage.trim(),
            genre: genre.trim()
        });

        const populatedAlbum = await albumModel.findById(album._id)
            .populate("artist", "username email role")
            .populate({
                path: "musics",
                populate: { path: "artist", select: "username email" }
            });

        return res.status(201).json({
            message: "Album created successfully",
            album: populatedAlbum
        });
    } catch (error) {
        console.error("createAlbum error:", error);
        return res.status(500).json({ message: "Failed to create album", error: error.message });
    }
}

async function getAllMusics(req, res) {
    try {
        const { search, genre, artist } = req.query;
        const filter = {};

        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { genre: { $regex: search, $options: 'i' } }
            ];
        }

        if (genre && genre.toLowerCase() !== 'all') {
            filter.genre = { $regex: new RegExp(`^${genre}$`, 'i') };
        }

        if (artist) {
            filter.artist = artist;
        }

        const musics = await musicModel
            .find(filter)
            .sort({ createdAt: -1, _id: -1 })
            .populate("artist", "username email role");

        return res.status(200).json({
            message: "Musics fetched successfully",
            count: musics.length,
            musics
        });
    } catch (error) {
        console.error("getAllMusics error:", error);
        return res.status(500).json({ message: "Failed to fetch musics", error: error.message });
    }
}

async function getMusicById(req, res) {
    try {
        const { id } = req.params;
        const music = await musicModel.findById(id).populate("artist", "username email role");

        if (!music) {
            return res.status(404).json({ message: "Track not found" });
        }

        return res.status(200).json({ music });
    } catch (error) {
        return res.status(500).json({ message: "Failed to fetch track", error: error.message });
    }
}

async function getAllAlbums(req, res) {
    try {
        const albums = await albumModel
            .find()
            .sort({ createdAt: -1, _id: -1 })
            .populate("artist", "username email role")
            .populate({
                path: "musics",
                populate: { path: "artist", select: "username email" }
            });

        return res.status(200).json({
            message: "Albums fetched successfully",
            count: albums.length,
            albums
        });
    } catch (error) {
        console.error("getAllAlbums error:", error);
        return res.status(500).json({ message: "Failed to fetch albums", error: error.message });
    }
}

async function getAlbumById(req, res) {
    try {
        const { albumId } = req.params;

        const album = await albumModel
            .findById(albumId)
            .populate("artist", "username email role")
            .populate({
                path: "musics",
                populate: { path: "artist", select: "username email" }
            });

        if (!album) {
            return res.status(404).json({ message: "Album not found" });
        }

        return res.status(200).json({
            message: "Album fetched successfully",
            album
        });
    } catch (error) {
        console.error("getAlbumById error:", error);
        return res.status(500).json({ message: "Failed to fetch album", error: error.message });
    }
}

async function getArtistTracks(req, res) {
    try {
        const tracks = await musicModel
            .find({ artist: req.user.id })
            .sort({ createdAt: -1, _id: -1 })
            .populate("artist", "username email role");

        return res.status(200).json({ tracks });
    } catch (error) {
        console.error("getArtistTracks error:", error);
        return res.status(500).json({ message: "Failed to fetch artist tracks" });
    }
}

async function getArtistAlbums(req, res) {
    try {
        const albums = await albumModel
            .find({ artist: req.user.id })
            .sort({ createdAt: -1, _id: -1 })
            .populate({
                path: "musics",
                populate: { path: "artist", select: "username email" }
            });

        return res.status(200).json({ albums });
    } catch (error) {
        console.error("getArtistAlbums error:", error);
        return res.status(500).json({ message: "Failed to fetch artist albums" });
    }
}

async function deleteMusic(req, res) {
    try {
        const { id } = req.params;
        const track = await musicModel.findById(id);

        if (!track) {
            return res.status(404).json({ message: "Track not found" });
        }

        if (track.artist.toString() !== req.user.id) {
            return res.status(403).json({ message: "Forbidden: You can only delete your own tracks" });
        }

        await musicModel.findByIdAndDelete(id);
        // Remove track reference from any albums
        await albumModel.updateMany({ musics: id }, { $pull: { musics: id } });

        return res.status(200).json({ message: "Track deleted successfully" });
    } catch (error) {
        console.error("deleteMusic error:", error);
        return res.status(500).json({ message: "Failed to delete track" });
    }
}

async function playTrack(req, res) {
    try {
        const { id } = req.params;
        const track = await musicModel.findByIdAndUpdate(id, { $inc: { plays: 1 } }, { returnDocument: 'after' });
        return res.status(200).json({ plays: track ? track.plays : 0 });
    } catch (error) {
        return res.status(500).json({ message: "Failed to update play count" });
    }
}

module.exports = {
    createMusic,
    createAlbum,
    getAllMusics,
    getMusicById,
    getAllAlbums,
    getAlbumById,
    getArtistTracks,
    getArtistAlbums,
    deleteMusic,
    playTrack
};