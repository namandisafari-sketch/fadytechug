import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Users, Shield, Search, UserPlus, Settings2 } from 'lucide-react';

interface StaffMember {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'staff' | null;
  page_permissions: string[];
}

const ADMIN_PAGES = [
  { path: '/admin', label: 'Dashboard', description: 'View dashboard statistics' },
  { path: '/admin/pos', label: 'Point of Sale', description: 'Process sales transactions' },
  { path: '/admin/products', label: 'Products', description: 'Manage product catalog' },
  { path: '/admin/inventory', label: 'Inventory', description: 'Manage stock levels' },
  { path: '/admin/serial-numbers', label: 'Serial Numbers', description: 'Track serial numbers' },
  { path: '/admin/sales', label: 'Sales & Refunds', description: 'View sales and process refunds' },
  { path: '/admin/purchase-orders', label: 'Purchase Orders', description: 'Manage purchase orders' },
  { path: '/admin/expenses', label: 'Expenses', description: 'Track business expenses' },
  { path: '/admin/suppliers', label: 'Suppliers', description: 'Manage suppliers' },
  { path: '/admin/banking', label: 'Banking', description: 'Manage deposits and cash register' },
  { path: '/admin/reports', label: 'Reports', description: 'View business reports' },
  { path: '/admin/customers', label: 'Customers', description: 'Manage customer records' },
  { path: '/admin/inquiries', label: 'Inquiries', description: 'Handle customer inquiries' },
  { path: '/admin/settings', label: 'Settings', description: 'System settings' },
];

const StaffManagement = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMember, setSelectedMember] = useState<StaffMember | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [selectedRole, setSelectedRole] = useState<'admin' | 'staff'>('staff');
  const [selectedPages, setSelectedPages] = useState<string[]>([]);
  
  // New user form
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserDialogOpen, setNewUserDialogOpen] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchStaffMembers();
    }
  }, [isAdmin]);

  const fetchStaffMembers = async () => {
    setLoading(true);
    
    // Get all profiles with their roles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name');
    
    if (profilesError) {
      toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' });
      setLoading(false);
      return;
    }

    // Get all user roles
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role');
    
    // Get all page permissions
    const { data: permissions } = await supabase
      .from('page_permissions')
      .select('user_id, page_path');
    
    // Combine data
    const members: StaffMember[] = (profiles || []).map(profile => {
      const userRole = roles?.find(r => r.user_id === profile.id);
      const userPermissions = permissions?.filter(p => p.user_id === profile.id).map(p => p.page_path) || [];
      
      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: userRole?.role as 'admin' | 'staff' | null,
        page_permissions: userPermissions
      };
    });
    
    setStaffMembers(members);
    setLoading(false);
  };

  const openEditDialog = (member: StaffMember) => {
    setSelectedMember(member);
    setSelectedRole(member.role || 'staff');
    setSelectedPages(member.page_permissions);
    setDialogOpen(true);
  };

  const togglePage = (path: string) => {
    setSelectedPages(prev => 
      prev.includes(path) 
        ? prev.filter(p => p !== path)
        : [...prev, path]
    );
  };

  const selectAllPages = () => {
    setSelectedPages(ADMIN_PAGES.map(p => p.path));
  };

  const deselectAllPages = () => {
    setSelectedPages([]);
  };

  const savePermissions = async () => {
    if (!selectedMember) return;
    
    setSaving(true);
    
    try {
      // Update or insert role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', selectedMember.id)
        .maybeSingle();
      
      if (existingRole) {
        // Update existing role
        await supabase
          .from('user_roles')
          .update({ role: selectedRole })
          .eq('user_id', selectedMember.id);
      } else {
        // Insert new role
        await supabase
          .from('user_roles')
          .insert({ user_id: selectedMember.id, role: selectedRole });
      }
      
      // Delete existing page permissions
      await supabase
        .from('page_permissions')
        .delete()
        .eq('user_id', selectedMember.id);
      
      // Insert new page permissions (only for staff, admins have all access)
      if (selectedRole === 'staff' && selectedPages.length > 0) {
        const permissionsToInsert = selectedPages.map(path => ({
          user_id: selectedMember.id,
          page_path: path
        }));
        
        await supabase
          .from('page_permissions')
          .insert(permissionsToInsert);
      }
      
      toast({ title: 'Success', description: 'Permissions updated successfully' });
      setDialogOpen(false);
      fetchStaffMembers();
      
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const removeRole = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this user\'s staff access?')) return;
    
    try {
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', memberId);
      
      await supabase
        .from('page_permissions')
        .delete()
        .eq('user_id', memberId);
      
      toast({ title: 'Success', description: 'Staff access removed' });
      fetchStaffMembers();
      
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const filteredMembers = staffMembers.filter(m =>
    m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  const staffWithRoles = filteredMembers.filter(m => m.role);
  const usersWithoutRoles = filteredMembers.filter(m => !m.role);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Only admins can access staff management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Staff Management</h1>
        <p className="text-muted-foreground">Manage user roles and page access permissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold">{staffMembers.filter(m => m.role === 'admin').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Staff Members</p>
                <p className="text-2xl font-bold">{staffMembers.filter(m => m.role === 'staff').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-muted rounded-lg">
                <UserPlus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Registered Users</p>
                <p className="text-2xl font-bold">{staffMembers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Staff with Roles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Staff & Admins
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Page Access</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffWithRoles.map(member => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{member.full_name || 'No name'}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={member.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                      {member.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {member.role === 'admin' ? (
                      <span className="text-sm text-muted-foreground">All pages</span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {member.page_permissions.length} page{member.page_permissions.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(member)}>
                        <Settings2 className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                      {member.id !== user?.id && (
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeRole(member.id)}>
                          Remove
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {staffWithRoles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No staff members found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Users without Roles */}
      {usersWithoutRoles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Registered Users (No Role Assigned)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usersWithoutRoles.map(member => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{member.full_name || 'No name'}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(member)}>
                        <UserPlus className="h-4 w-4 mr-1" />
                        Assign Role
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Edit Permissions Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Access for {selectedMember?.email}</DialogTitle>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-6">
              {/* Role Selection */}
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as 'admin' | 'staff')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (Full Access)</SelectItem>
                    <SelectItem value="staff">Staff (Limited Access)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {selectedRole === 'admin' 
                    ? 'Admins have access to all pages and can manage other users.'
                    : 'Staff members only have access to selected pages below.'}
                </p>
              </div>

              {/* Page Permissions (only for staff) */}
              {selectedRole === 'staff' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Page Access</Label>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={selectAllPages}>
                        Select All
                      </Button>
                      <Button size="sm" variant="outline" onClick={deselectAllPages}>
                        Deselect All
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3 max-h-80 overflow-y-auto p-1">
                    {ADMIN_PAGES.map(page => (
                      <div 
                        key={page.path}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedPages.includes(page.path) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:bg-muted/50'
                        }`}
                        onClick={() => togglePage(page.path)}
                      >
                        <Checkbox 
                          checked={selectedPages.includes(page.path)}
                          onCheckedChange={() => togglePage(page.path)}
                        />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{page.label}</p>
                          <p className="text-xs text-muted-foreground">{page.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedPages.length} of {ADMIN_PAGES.length} pages
                  </p>
                </div>
              )}

              <Button onClick={savePermissions} disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Save Permissions'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagement;
