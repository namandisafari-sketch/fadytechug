import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  Palette, Image, LayoutGrid, Save, Loader2, 
  GripVertical, Eye, EyeOff, RefreshCw
} from 'lucide-react';

interface ThemeSettings {
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  siteName: string;
}

interface HeroSettings {
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaText: string;
  ctaLink: string;
}

interface CategorySettings {
  visible: string[];
  order: string[];
}

const DEFAULT_CATEGORIES = ['Routers', 'Switches', 'Cables', 'Servers', 'Phones', 'Laptops', 'Furniture'];

const SiteAppearance = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [theme, setTheme] = useState<ThemeSettings>({
    primaryColor: '#f97316',
    accentColor: '#1e3a5f',
    logoUrl: '',
    siteName: 'Fady Technologies'
  });
  
  const [hero, setHero] = useState<HeroSettings>({
    title: 'Premium Network Equipment',
    subtitle: 'Quality networking solutions for businesses and professionals',
    imageUrl: '',
    ctaText: 'Shop Now',
    ctaLink: '/products'
  });
  
  const [categories, setCategories] = useState<CategorySettings>({
    visible: DEFAULT_CATEGORIES,
    order: []
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

      if (error) throw error;

      data?.forEach(setting => {
        const value = setting.value as Record<string, unknown>;
        if (setting.key === 'theme') {
          setTheme({
            primaryColor: (value.primaryColor as string) || '#f97316',
            accentColor: (value.accentColor as string) || '#1e3a5f',
            logoUrl: (value.logoUrl as string) || '',
            siteName: (value.siteName as string) || 'Fady Technologies'
          });
        } else if (setting.key === 'hero') {
          setHero({
            title: (value.title as string) || 'Premium Network Equipment',
            subtitle: (value.subtitle as string) || '',
            imageUrl: (value.imageUrl as string) || '',
            ctaText: (value.ctaText as string) || 'Shop Now',
            ctaLink: (value.ctaLink as string) || '/products'
          });
        } else if (setting.key === 'categories') {
          setCategories({
            visible: (value.visible as string[]) || DEFAULT_CATEGORIES,
            order: (value.order as string[]) || []
          });
        }
      });
    } catch (error: unknown) {
      const err = error as Error;
      toast({ title: 'Error loading settings', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const saveSetting = async (key: string, value: ThemeSettings | HeroSettings | CategorySettings) => {
    setSaving(true);
    try {
      // Check if setting exists
      const { data: existing } = await supabase
        .from('site_settings')
        .select('id')
        .eq('key', key)
        .maybeSingle();

      let error;
      if (existing) {
        // Update existing
        const result = await supabase
          .from('site_settings')
          .update({ 
            value: JSON.parse(JSON.stringify(value)),
            updated_by: user?.id 
          })
          .eq('key', key);
        error = result.error;
      } else {
        // Insert new
        const result = await supabase
          .from('site_settings')
          .insert([{ 
            key,
            value: JSON.parse(JSON.stringify(value)),
            updated_by: user?.id 
          }]);
        error = result.error;
      }

      if (error) throw error;
      toast({ title: 'Settings saved', description: `${key} settings updated successfully` });
    } catch (error: unknown) {
      const err = error as Error;
      toast({ title: 'Error saving settings', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = (category: string) => {
    setCategories(prev => ({
      ...prev,
      visible: prev.visible.includes(category)
        ? prev.visible.filter(c => c !== category)
        : [...prev.visible, category]
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Site Appearance</h1>
          <p className="text-muted-foreground">Control how your store looks to customers</p>
        </div>
        <Button variant="outline" onClick={fetchSettings}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="theme" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="theme" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Theme & Branding</span>
            <span className="sm:hidden">Theme</span>
          </TabsTrigger>
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Hero Section</span>
            <span className="sm:hidden">Hero</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            <span className="hidden sm:inline">Categories</span>
            <span className="sm:hidden">Cats</span>
          </TabsTrigger>
        </TabsList>

        {/* Theme & Branding Tab */}
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Theme & Branding
              </CardTitle>
              <CardDescription>
                Customize your store's colors and branding identity
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Site Name</Label>
                  <Input
                    value={theme.siteName}
                    onChange={(e) => setTheme({ ...theme, siteName: e.target.value })}
                    placeholder="Your Store Name"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Logo URL</Label>
                  <Input
                    value={theme.logoUrl}
                    onChange={(e) => setTheme({ ...theme, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                      className="w-12 h-12 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={theme.primaryColor}
                      onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                      className="flex-1"
                      placeholder="#f97316"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Used for buttons, links, and accents</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={theme.accentColor}
                      onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                      className="w-12 h-12 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={theme.accentColor}
                      onChange={(e) => setTheme({ ...theme, accentColor: e.target.value })}
                      className="flex-1"
                      placeholder="#1e3a5f"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Used for secondary elements</p>
                </div>
              </div>

              {/* Preview */}
              <div className="border rounded-lg p-4 bg-muted/50">
                <p className="text-sm font-medium mb-3">Preview</p>
                <div className="flex items-center gap-4">
                  <div 
                    className="px-4 py-2 rounded-lg text-white font-medium"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    Primary Button
                  </div>
                  <div 
                    className="px-4 py-2 rounded-lg text-white font-medium"
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    Accent Button
                  </div>
                </div>
              </div>

              <Button onClick={() => saveSetting('theme', theme)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Theme Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hero Section Tab */}
        <TabsContent value="hero">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Hero Section
              </CardTitle>
              <CardDescription>
                Customize the main banner on your homepage
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Hero Title</Label>
                <Input
                  value={hero.title}
                  onChange={(e) => setHero({ ...hero, title: e.target.value })}
                  placeholder="Welcome to our store"
                />
              </div>

              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input
                  value={hero.subtitle}
                  onChange={(e) => setHero({ ...hero, subtitle: e.target.value })}
                  placeholder="Quality products for your needs"
                />
              </div>

              <div className="space-y-2">
                <Label>Background Image URL</Label>
                <Input
                  value={hero.imageUrl}
                  onChange={(e) => setHero({ ...hero, imageUrl: e.target.value })}
                  placeholder="https://example.com/hero-image.jpg"
                />
                <p className="text-xs text-muted-foreground">Leave empty to use default gradient</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Call-to-Action Text</Label>
                  <Input
                    value={hero.ctaText}
                    onChange={(e) => setHero({ ...hero, ctaText: e.target.value })}
                    placeholder="Shop Now"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Call-to-Action Link</Label>
                  <Input
                    value={hero.ctaLink}
                    onChange={(e) => setHero({ ...hero, ctaLink: e.target.value })}
                    placeholder="/products"
                  />
                </div>
              </div>

              {/* Preview */}
              <div 
                className="border rounded-lg p-8 text-center text-white relative overflow-hidden"
                style={{ 
                  backgroundColor: theme.primaryColor,
                  backgroundImage: hero.imageUrl ? `url(${hero.imageUrl})` : undefined,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                {hero.imageUrl && <div className="absolute inset-0 bg-black/50" />}
                <div className="relative z-10 space-y-4">
                  <h2 className="text-2xl font-bold">{hero.title || 'Hero Title'}</h2>
                  <p className="text-white/90">{hero.subtitle || 'Subtitle text here'}</p>
                  <button 
                    className="px-6 py-2 rounded-lg font-medium"
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    {hero.ctaText || 'Button'}
                  </button>
                </div>
              </div>

              <Button onClick={() => saveSetting('hero', hero)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Hero Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutGrid className="h-5 w-5" />
                Category Management
              </CardTitle>
              <CardDescription>
                Control which categories are visible to customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {DEFAULT_CATEGORIES.map((category) => {
                  const isVisible = categories.visible.includes(category);
                  return (
                    <div 
                      key={category}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{category}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={isVisible ? "default" : "secondary"}>
                          {isVisible ? (
                            <><Eye className="h-3 w-3 mr-1" /> Visible</>
                          ) : (
                            <><EyeOff className="h-3 w-3 mr-1" /> Hidden</>
                          )}
                        </Badge>
                        <Switch
                          checked={isVisible}
                          onCheckedChange={() => toggleCategory(category)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>{categories.visible.length}</strong> of {DEFAULT_CATEGORIES.length} categories visible to customers
                </p>
              </div>

              <Button onClick={() => saveSetting('categories', categories)} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Category Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SiteAppearance;
