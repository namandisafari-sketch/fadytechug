import { Car, Home, Laptop, Smartphone, Shirt, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";

const categories = [
  { name: "Vehicles", icon: Car, count: "2,345" },
  { name: "Property", icon: Home, count: "1,823" },
  { name: "Electronics", icon: Laptop, count: "5,671" },
  { name: "Mobile Phones", icon: Smartphone, count: "3,456" },
  { name: "Fashion", icon: Shirt, count: "4,234" },
  { name: "Jobs", icon: Briefcase, count: "892" },
];

const Categories = () => {
  return (
    <section className="py-16 bg-muted/50">
      <div className="container">
        <h2 className="text-3xl font-bold mb-8">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <Card 
                key={category.name}
                className="p-6 hover:shadow-lg transition-all cursor-pointer hover:-translate-y-1 border-border/50"
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.count} ads</p>
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
