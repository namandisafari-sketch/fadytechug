import ProductCard from "./ProductCard";
import routerImage from "@/assets/product-router.jpg";
import switchImage from "@/assets/product-switch.jpg";
import cablesImage from "@/assets/product-cables.jpg";
import serverImage from "@/assets/product-server.jpg";

const products = [
  {
    id: "1",
    title: "Cisco ISR 4321 Router - Enterprise Grade",
    price: "$1,299",
    location: "Lagos",
    image: routerImage,
    timeAgo: "2h ago",
  },
  {
    id: "2",
    title: "Netgear 24-Port Gigabit Managed Switch",
    price: "$450",
    location: "Abuja",
    image: switchImage,
    timeAgo: "5h ago",
  },
  {
    id: "3",
    title: "Cat6 Ethernet Cable Bundle - 50 Pack",
    price: "$89",
    location: "Lagos",
    image: cablesImage,
    timeAgo: "1d ago",
  },
  {
    id: "4",
    title: "Dell PowerEdge R740 Server - 64GB RAM",
    price: "$4,500",
    location: "Port Harcourt",
    image: serverImage,
    timeAgo: "3d ago",
  },
  {
    id: "5",
    title: "TP-Link Archer AX6000 WiFi 6 Router",
    price: "$299",
    location: "Ibadan",
    image: routerImage,
    timeAgo: "4h ago",
  },
  {
    id: "6",
    title: "Ubiquiti UniFi 48-Port PoE Switch",
    price: "$899",
    location: "Lagos",
    image: switchImage,
    timeAgo: "6h ago",
  },
  {
    id: "7",
    title: "Fiber Optic Patch Cables - LC to SC, 10 Pack",
    price: "$45",
    location: "Abuja",
    image: cablesImage,
    timeAgo: "1d ago",
  },
  {
    id: "8",
    title: "HP ProLiant DL380 Gen10 Server",
    price: "$3,800",
    location: "Lagos",
    image: serverImage,
    timeAgo: "2d ago",
  },
];

const FeaturedListings = () => {
  return (
    <section className="py-16">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Latest Equipment</h2>
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
