import routerImage from "@/assets/product-router.jpg";
import switchImage from "@/assets/product-switch.jpg";
import cablesImage from "@/assets/product-cables.jpg";
import serverImage from "@/assets/product-server.jpg";
import { formatCurrency } from "@/lib/currency";

export interface Product {
  id: string;
  title: string;
  price: string;
  priceValue: number;
  image: string;
  category: string;
  description: string;
  specifications: {
    label: string;
    value: string;
  }[];
  inStock: boolean;
}

// UGX prices for network equipment
const productData = [
  {
    id: "1",
    title: "Cisco ISR 4321 Router - Enterprise Grade",
    priceValue: 4800000,
    image: routerImage,
    category: "Routers",
    description: "Enterprise-grade Cisco ISR 4321 Integrated Services Router. Supports up to 50 Mbps aggregate throughput and includes 2 onboard GE, 2 NIM slots, and 4 GB Flash Memory. Perfect for small to medium business networks. Comes with power cable and console cable. Warranty available.",
    specifications: [
      { label: "Brand", value: "Cisco" },
      { label: "Model", value: "ISR 4321" },
      { label: "Ports", value: "2x GE WAN/LAN" },
      { label: "Memory", value: "4 GB Flash" },
      { label: "Throughput", value: "50 Mbps" },
      { label: "Condition", value: "New" },
    ],
    inStock: true,
  },
  {
    id: "2",
    title: "Netgear 24-Port Gigabit Managed Switch",
    priceValue: 1650000,
    image: switchImage,
    category: "Switches",
    description: "Professional-grade 24-port Gigabit managed switch with advanced L2+ features. Ideal for small to medium businesses requiring reliable network infrastructure with VLAN support, QoS, and link aggregation capabilities.",
    specifications: [
      { label: "Brand", value: "Netgear" },
      { label: "Ports", value: "24x Gigabit Ethernet" },
      { label: "Management", value: "Fully Managed L2+" },
      { label: "VLAN Support", value: "Yes" },
      { label: "PoE", value: "No" },
      { label: "Condition", value: "New" },
    ],
    inStock: true,
  },
  {
    id: "3",
    title: "Cat6 Ethernet Cable Bundle - 50 Pack",
    priceValue: 330000,
    image: cablesImage,
    category: "Cables",
    description: "High-quality Cat6 Ethernet cables in a convenient 50-pack bundle. Perfect for data centers, offices, and network installations. Each cable is tested to ensure maximum performance and reliability.",
    specifications: [
      { label: "Type", value: "Cat6" },
      { label: "Length", value: "1m each" },
      { label: "Quantity", value: "50 cables" },
      { label: "Shielding", value: "UTP" },
      { label: "Connector", value: "RJ45" },
      { label: "Color", value: "Blue" },
    ],
    inStock: true,
  },
  {
    id: "4",
    title: "Dell PowerEdge R740 Server - 64GB RAM",
    priceValue: 16650000,
    image: serverImage,
    category: "Servers",
    description: "Dell PowerEdge R740 rack server with 64GB RAM. Enterprise-class 2U rack server designed for demanding workloads. Features dual Intel Xeon processors, extensive storage options, and excellent expandability.",
    specifications: [
      { label: "Brand", value: "Dell" },
      { label: "Model", value: "PowerEdge R740" },
      { label: "RAM", value: "64 GB DDR4" },
      { label: "Processor", value: "Dual Intel Xeon" },
      { label: "Form Factor", value: "2U Rack" },
      { label: "Condition", value: "Refurbished" },
    ],
    inStock: true,
  },
  {
    id: "5",
    title: "TP-Link Archer AX6000 WiFi 6 Router",
    priceValue: 1100000,
    image: routerImage,
    category: "Routers",
    description: "Next-generation WiFi 6 router with blazing-fast speeds up to 6 Gbps. Features 8 high-gain antennas, 8 Gigabit LAN ports, and advanced security features. Perfect for high-bandwidth home and office networks.",
    specifications: [
      { label: "Brand", value: "TP-Link" },
      { label: "Model", value: "Archer AX6000" },
      { label: "WiFi Standard", value: "WiFi 6 (802.11ax)" },
      { label: "Speed", value: "Up to 6 Gbps" },
      { label: "LAN Ports", value: "8x Gigabit" },
      { label: "Condition", value: "New" },
    ],
    inStock: true,
  },
  {
    id: "6",
    title: "Ubiquiti UniFi 48-Port PoE Switch",
    priceValue: 3320000,
    image: switchImage,
    category: "Switches",
    description: "Enterprise-grade 48-port PoE switch from Ubiquiti's UniFi line. Provides power over Ethernet to compatible devices while offering enterprise performance and reliability. Managed through the intuitive UniFi Controller.",
    specifications: [
      { label: "Brand", value: "Ubiquiti" },
      { label: "Model", value: "UniFi Switch 48 PoE" },
      { label: "Ports", value: "48x Gigabit + 4x SFP+" },
      { label: "PoE Budget", value: "500W" },
      { label: "Management", value: "UniFi Controller" },
      { label: "Condition", value: "New" },
    ],
    inStock: true,
  },
  {
    id: "7",
    title: "Fiber Optic Patch Cables - LC to SC, 10 Pack",
    priceValue: 165000,
    image: cablesImage,
    category: "Cables",
    description: "Premium fiber optic patch cables with LC to SC connectors. Single-mode fiber for high-speed, long-distance data transmission. Ideal for data centers and enterprise networking installations.",
    specifications: [
      { label: "Type", value: "Single-mode Fiber" },
      { label: "Connectors", value: "LC to SC" },
      { label: "Length", value: "3m each" },
      { label: "Quantity", value: "10 cables" },
      { label: "Core", value: "9/125μm" },
      { label: "Color", value: "Yellow" },
    ],
    inStock: false,
  },
  {
    id: "8",
    title: "HP ProLiant DL380 Gen10 Server",
    priceValue: 14050000,
    image: serverImage,
    category: "Servers",
    description: "HP ProLiant DL380 Gen10 - the industry-leading 2P rack server. Provides enterprise-class performance, security, and expandability. Ideal for virtualization, database, and high-performance computing workloads.",
    specifications: [
      { label: "Brand", value: "HP" },
      { label: "Model", value: "ProLiant DL380 Gen10" },
      { label: "RAM", value: "32 GB DDR4" },
      { label: "Processor", value: "Intel Xeon Silver" },
      { label: "Form Factor", value: "2U Rack" },
      { label: "Condition", value: "New" },
    ],
    inStock: true,
  },
];

// Generate products with formatted UGX prices
export const products: Product[] = productData.map(product => ({
  ...product,
  price: formatCurrency(product.priceValue),
}));

export const getProductById = (id: string): Product | undefined => {
  return products.find((product) => product.id === id);
};
