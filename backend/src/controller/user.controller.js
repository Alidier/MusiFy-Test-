import { User } from "../models/user.model.js"; //
import { Message } from "../models/message.model.js"; //
import {Song} from "../models/song.model.js"; // Убедитесь, что этот импорт есть и путь к файлу модели Song правильный

export const getAllUsers = async (req, res, next) => {
    try {
        const currentUserId = req.auth.userId;
        const users = await User.find({ clerkId: { $ne: currentUserId } });
        res.status(200).json(users);
    } catch (error) {
        next(error);
    }
};

export const getMessages = async (req, res, next) => {
    try {
        const myId = req.auth.userId;
        const { userId } = req.params;

        const messages = await Message.find({
            $or: [
                { senderId: userId, receiverId: myId },
                { senderId: myId, receiverId: userId },
            ],
        }).sort({ createdAt: 1 });

        res.status(200).json(messages);
    } catch (error) {
        next(error);
    }
};

// --- ФУНКЦИИ ДЛЯ ИЗБРАННОГО С ИСПРАВЛЕННЫМ POPULATE ---

export const getFavouriteSongs = async (req, res, next) => {
    try {
        const clerkUserId = req.auth.userId;
        if (!clerkUserId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const user = await User.findOne({ clerkId: clerkUserId }).populate({
            path: 'favouriteSongs', // Загружает полные объекты Song
            populate: {
                path: 'albumId', // <--- ИСПРАВЛЕНО: используем 'albumId' (поле из song.model.js)
                model: 'Album'   // Можно указать модель для ясности, или Mongoose сам определит по ref в схеме Song
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found in local database" });
        }
        res.status(200).json(user.favouriteSongs || []);
    } catch (error) {
        console.error('Error fetching favourite songs:', error);
        next(error);
    }
};

export const addSongToFavourites = async (req, res, next) => {
    try {
        const clerkUserId = req.auth.userId;
        const { songId } = req.params;

        if (!clerkUserId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        const user = await User.findOne({ clerkId: clerkUserId });
        if (!user) {
            return res.status(404).json({ message: "User not found in local database" });
        }

        const song = await Song.findById(songId);
        if (!song) {
            return res.status(404).json({ message: "Song not found" });
        }

        if (user.favouriteSongs.find(favSongId => favSongId.equals(songId))) {
            // Если песня уже в избранном, можно просто вернуть текущий список или специфическое сообщение
            // Для консистентности с фронтендом, который ожидает список, вернем текущий список.
             const currentUserWithFavourites = await User.findOne({ clerkId: clerkUserId }).populate({
                path: 'favouriteSongs',
                populate: { path: 'albumId', model: 'Album' }
            });
            return res.status(200).json({ // Можно использовать статус 200 или 400 для "уже в избранном"
                message: "Song already in favourites",
                favouriteSongs: currentUserWithFavourites.favouriteSongs || []
            });
        }

        user.favouriteSongs.push(songId);
        await user.save();

        const updatedUser = await User.findOne({ clerkId: clerkUserId }).populate({
            path: 'favouriteSongs',
            populate: {
                path: 'albumId', // <--- ИСПРАВЛЕНО
                model: 'Album'
            }
        });

        res.status(200).json({
            message: "Song added to favourites",
            favouriteSongs: updatedUser.favouriteSongs || []
        });
    } catch (error) {
        console.error('Error adding song to favourites:', error);
        next(error);
    }
};

export const removeSongFromFavourites = async (req, res, next) => {
    try {
        const clerkUserId = req.auth.userId;
        const { songId } = req.params;

        if (!clerkUserId) {
            return res.status(401).json({ message: "User not authenticated" });
        }

        let user = await User.findOne({ clerkId: clerkUserId }); // Объявляем user с let для возможного переприсвоения
        if (!user) {
            return res.status(404).json({ message: "User not found in local database" });
        }

        const songIndex = user.favouriteSongs.findIndex(favSongId => favSongId.equals(songId));
        if (songIndex === -1) {
             // Если песни нет в избранном, можно просто вернуть текущий список или специфическое сообщение
            const currentUserWithFavourites = await User.findOne({ clerkId: clerkUserId }).populate({
                path: 'favouriteSongs',
                populate: { path: 'albumId', model: 'Album' }
            });
            return res.status(200).json({ // Можно использовать статус 200 или 400
                message: "Song not in favourites",
                favouriteSongs: currentUserWithFavourites.favouriteSongs || []
            });
        }

        user.favouriteSongs.splice(songIndex, 1);
        await user.save();
        
        // Перезапрашиваем пользователя, чтобы получить обновленный список с populate
        user = await User.findOne({ clerkId: clerkUserId }).populate({
            path: 'favouriteSongs',
            populate: {
                path: 'albumId', // <--- ИСПРАВЛЕНО
                model: 'Album'
            }
        });

        res.status(200).json({
            message: "Song removed from favourites",
            favouriteSongs: user.favouriteSongs || []
        });
    } catch (error) {
        console.error('Error removing song from favourites:', error);
        next(error);
    }
};