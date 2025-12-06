import { Router, Cable, Server, Wifi, HardDrive, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";

const categories = [
  { name: "Routers", icon: Router, count: "1,245", color: "bg-primary/10 text-primary" },
  { name: "Switches", icon: Wifi, count: "892", color: "bg-accent/10 text-accent" },
  { name: "Cables", icon: Cable, count: "3,567", color: "bg-primary/10 text-primary" },
  { name: "Servers", icon: Server, count: "456", color: "bg-accent/10 text-accent" },
  { name: "Storage", icon: HardDrive, count: "678", color: "bg-primary/10 text-primary" },
  { name: "Security", icon: Shield, count: "234", color: "bg-accent/10 text-accent" },
];

const Categories = () => {
  return (
    <section className="py-16 bg-secondary/50">
      <div className="container">
        <h2 className="text-3xl font-bold mb-8">Browse Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card 
                key={category.name}
                className="p-6 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1 border-border/50 bg-card"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`h-14 w-14 rounded-xl ${category.color} flex items-center justify-center`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.count} items</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;
