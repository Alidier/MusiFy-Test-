// Предполагаемое имя файла: SectionGridSkeleton.tsx
// Находится в той же папке: src/pages/home/components/

import React from 'react'; // Хорошая практика - импортировать React, хотя в новых версиях не всегда обязательно

const SectionGridSkeleton = () => {
    // Этот компонент не принимает никаких пропсов
    return (
        <div className='mb-8'>
            {/* Плейсхолдер для заголовка секции */}
            <div className='h-8 w-48 bg-zinc-800 rounded mb-4 animate-pulse' />
            
            {/* Сетка для плейсхолдеров карточек песен */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                {/* Создаем 4 одинаковых карточки-скелетона */}
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className='bg-zinc-800/40 p-4 rounded-md animate-pulse'>
                        {/* Плейсхолдер для обложки */}
                        <div className='aspect-square rounded-md bg-zinc-700 mb-4' />
                        {/* Плейсхолдер для названия песни */}
                        <div className='h-4 bg-zinc-700 rounded w-3/4 mb-2' />
                        {/* Плейсхолдер для имени артиста */}
                        <div className='h-4 bg-zinc-700 rounded w-1/2' />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SectionGridSkeleton;