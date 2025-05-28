import { useAuthStore } from "@/stores/useAuthStore"; //
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-react";
import React, { useEffect, PropsWithChildren, useRef } from "react";

const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
    const { isSignedIn, isLoaded: clerkAuthLoaded } = useClerkAuth();
    useUser(); // Получаем пользователя Clerk для дополнительной информации, если нужно

    // Используем useRef для хранения ссылок на функции из стора, чтобы избежать их включения в зависимости useEffect,
    // если они действительно стабильны. Zustand обычно возвращает стабильные функции.
    // Но для большей уверенности или если ESLint требует, можно использовать getState() внутри useEffect.
    const checkAdminStatus = useAuthStore((state) => state.checkAdminStatus);
    const fetchFavouriteSongs = useAuthStore((state) => state.fetchFavouriteSongs);
    const resetAuthStore = useAuthStore((state) => state.reset);
    const isAdminLoaded = useAuthStore((state) => state.isAdminLoaded);
    const areFavouritesLoaded = useAuthStore((state) => state.areFavouritesLoaded);
    const favouriteSongsLength = useAuthStore((state) => state.favouriteSongs.length); // Для проверки, есть ли что сбрасывать

    // Используем Ref для отслеживания предыдущего состояния isSignedIn
    // чтобы вызывать reset только при реальном изменении статуса на "не залогинен"
    const prevIsSignedInRef = useRef<boolean | undefined>();

    useEffect(() => {
        console.log(
            '[AuthProvider] useEffect triggered. clerkAuthLoaded:', clerkAuthLoaded,
            'isSignedIn:', isSignedIn,
            'isAdminLoaded:', isAdminLoaded,
            'areFavouritesLoaded:', areFavouritesLoaded
        );

        if (clerkAuthLoaded) {
            if (isSignedIn) {
                // Пользователь вошел в систему
                if (!isAdminLoaded) {
                    console.log("[AuthProvider] User signed in. Fetching admin status.");
                    checkAdminStatus();
                } else {
                    console.log("[AuthProvider] User signed in. Admin status already loaded/checked.");
                }

                if (!areFavouritesLoaded) {
                    console.log("[AuthProvider] User signed in. Fetching favourite songs.");
                    fetchFavouriteSongs();
                } else {
                    console.log("[AuthProvider] User signed in. Favourite songs already loaded/checked.");
                }
            } else {
                // Пользователь не вошел в систему или вышел
                // Сбрасываем стор, только если он не был уже сброшен или если пользователь только что вышел
                if (prevIsSignedInRef.current === true && !isSignedIn) { // Пользователь только что вышел
                    console.log("[AuthProvider] User just signed out. Resetting auth store.");
                    resetAuthStore();
                } else if (!isSignedIn && (isAdminLoaded || areFavouritesLoaded || favouriteSongsLength > 0)) {
                    // Случай, когда пользователь изначально не залогинен, но в сторе есть данные (например, после SSR или ошибки)
                    console.log("[AuthProvider] User not signed in but store has data. Resetting auth store.");
                    resetAuthStore();
                } else {
                    console.log("[AuthProvider] User not signed in. Store already clean or nothing to reset.");
                }
            }
        }
        // Обновляем предыдущее значение isSignedIn для следующего вызова эффекта
        prevIsSignedInRef.current = isSignedIn;

    }, [
        isSignedIn,
        clerkAuthLoaded,
        isAdminLoaded,
        areFavouritesLoaded,
        checkAdminStatus, // Стабильная ссылка из Zustand
        fetchFavouriteSongs, // Стабильная ссылка из Zustand
        resetAuthStore, // Стабильная ссылка из Zustand
        favouriteSongsLength // Добавляем, чтобы реагировать на изменение этой части состояния для reset
    ]);

    if (!clerkAuthLoaded) {
        // Можно вернуть глобальный загрузчик/скелет для всего приложения, если это необходимо
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#121212', color: 'white' }}>
                Initializing session... {/* Или ваш компонент загрузки */}
            </div>
        );
    }

    return <>{children}</>;
};

export default AuthProvider;