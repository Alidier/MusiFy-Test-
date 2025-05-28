import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button'; //
import { useAuthStore } from '@/stores/useAuthStore'; //
import { useAuth } from '@clerk/clerk-react'; // Для проверки, вошел ли пользователь в систему
import { cn } from '@/lib/utils'; //

interface FavouriteButtonProps {
  songId: string;
  className?: string;
}

const FavouriteButton: React.FC<FavouriteButtonProps> = ({ songId, className }) => {
  const { isSignedIn } = useAuth();
  const { isFavourite, addFavouriteSong, removeFavouriteSong, isLoadingFavourites } = useAuthStore();

  if (!isSignedIn) {
    return null; // Не показываем кнопку, если пользователь не аутентифицирован
  }

  const handleToggleFavourite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Останавливаем всплытие события, чтобы не сработал, например, клик по ряду таблицы
    if (isLoadingFavourites) return; // Предотвращаем двойные клики во время загрузки

    if (isFavourite(songId)) {
      removeFavouriteSong(songId);
    } else {
      addFavouriteSong(songId);
    }
  };

  const favouriteState = isFavourite(songId);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleToggleFavourite}
      className={cn(
        'text-muted-foreground hover:text-primary disabled:opacity-50',
        favouriteState ? 'text-red-500 hover:text-red-600' : '',
        className
      )}
      disabled={isLoadingFavourites}
      aria-label={favouriteState ? 'Remove from favourites' : 'Add to favourites'}
    >
      <Heart
        className="w-5 h-5"
        fill={favouriteState ? 'currentColor' : 'none'}
      />
    </Button>
  );
};

export default FavouriteButton;