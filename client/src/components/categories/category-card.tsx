import { Link } from "wouter";
import { Category } from "@shared/schema";
import { 
  Shirt, 
  Laptop, 
  Home, 
  BookOpen, 
  HeartPulse, 
  Gamepad2
} from "lucide-react";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  // Map category icon names to Lucide icons
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'shirt':
        return <Shirt className="h-6 w-6" />;
      case 'computer':
        return <Laptop className="h-6 w-6" />;
      case 'home':
        return <Home className="h-6 w-6" />;
      case 'book-open':
        return <BookOpen className="h-6 w-6" />;
      case 'heart-pulse':
        return <HeartPulse className="h-6 w-6" />;
      case 'gamepad-2':
        return <Gamepad2 className="h-6 w-6" />;
      default:
        return <Shirt className="h-6 w-6" />;
    }
  };
  
  return (
    <Link href={`/products?category=${category.slug}`} className="category-card bg-white rounded-xl p-4 shadow-sm hover:shadow-md flex flex-col items-center justify-center text-center transition duration-200 border border-gray-100">
      <div 
        className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
        style={{ backgroundColor: `${category.iconColor}20` }} // Using 20% opacity version of the color
      >
        <div style={{ color: category.iconColor }}>
          {getIcon(category.iconName)}
        </div>
      </div>
      <h3 className="font-semibold text-gray-900">{category.name}</h3>
      <p className="text-xs text-gray-500 mt-1">{category.productCount} products</p>
    </Link>
  );
}
