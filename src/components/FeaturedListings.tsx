import ProductCard from "./ProductCard";
import phoneImage from "@/assets/product-phone.jpg";
import furnitureImage from "@/assets/product-furniture.jpg";
import laptopImage from "@/assets/product-laptop.jpg";
import carImage from "@/assets/product-car.jpg";

const products = [
  {
    id: "1",
    title: "iPhone 14 Pro Max - 256GB, Excellent Condition",
    price: "$899",
    location: "Lagos",
    image: phoneImage,
    timeAgo: "2h ago",
  },
  {
    id: "2",
    title: "Modern 3-Seater Sofa - Grey Fabric",
    price: "$450",
    location: "Abuja",
    image: furnitureImage,
    timeAgo: "5h ago",
  },
  {
    id: "3",
    title: "MacBook Pro 2023 - M2 Chip, 16GB RAM",
    price: "$1,899",
    location: "Lagos",
    image: laptopImage,
    timeAgo: "1d ago",
  },
  {
    id: "4",
    title: "Toyota RAV4 2021 - Low Mileage",
    price: "$28,500",
    location: "Port Harcourt",
    image: carImage,
    timeAgo: "3d ago",
  },
  {
    id: "5",
    title: "Samsung Galaxy S23 Ultra - 512GB",
    price: "$1,099",
    location: "Ibadan",
    image: phoneImage,
    timeAgo: "4h ago",
  },
  {
    id: "6",
    title: "Gaming Laptop - RTX 4070, 32GB RAM",
    price: "$1,599",
    location: "Lagos",
    image: laptopImage,
    timeAgo: "6h ago",
  },
  {
    id: "7",
    title: "Dining Table Set - 6 Chairs Included",
    price: "$680",
    location: "Abuja",
    image: furnitureImage,
    timeAgo: "1d ago",
  },
  {
    id: "8",
    title: "Honda Accord 2020 - Pristine Condition",
    price: "$22,000",
    location: "Lagos",
    image: carImage,
    timeAgo: "2d ago",
  },
];

const FeaturedListings = () => {
  return (
    <section className="py-16">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Recent Listings</h2>
          <button className="text-primary hover:underline font-medium">
            View All
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;
