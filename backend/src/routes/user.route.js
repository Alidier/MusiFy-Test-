import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js"; // Вы используете protectRoute
import {
    getAllUsers,
    getMessages,
    // --- ДОБАВЬТЕ ЭТИ ИМПОРТЫ ---
    getFavouriteSongs,
    addSongToFavourites,
    removeSongFromFavourites,
    // Предполагается, что у вас есть и другие функции, если они нужны, например:
    // getUserProfile,
    // updateUserProfile,
} from "../controller/user.controller.js"; //

const router = Router();

// Существующие маршруты
router.get("/", protectRoute, getAllUsers); //
router.get("/messages/:userId", protectRoute, getMessages); //

// --- ДОБАВЬТЕ ЭТИ МАРШРУТЫ ДЛЯ ИЗБРАННОГО ---
router.get('/favourites', protectRoute, getFavouriteSongs);
router.post('/favourites/:songId', protectRoute, addSongToFavourites);
router.delete('/favourites/:songId', protectRoute, removeSongFromFavourites);

// Другие маршруты пользователя, если они есть (например, для профиля)
// router.get('/profile', protectRoute, getUserProfile);
// router.put('/profile', protectRoute, updateUserProfile);

export default router;