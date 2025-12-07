import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const Inquiries = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Inquiries</h1>
        <p className="text-muted-foreground">Track and manage customer inquiries</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Inquiry List
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No inquiries yet</p>
            <p className="text-sm">Customer inquiries will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Inquiries;
