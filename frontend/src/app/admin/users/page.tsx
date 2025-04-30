'use client';

import React, { useState } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { PageLayout } from '@/components/ui/PageLayout';

// Mock data for demonstration
const mockUsers = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'SUPER_ADMIN', status: 'Active', lastLogin: '2023-05-01' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'CLIENT', status: 'Active', lastLogin: '2023-04-28' },
  { id: '3', name: 'Mike Johnson', email: 'mike@example.com', role: 'CLIENT', status: 'Inactive', lastLogin: '2023-03-15' },
  { id: '4', name: 'Sarah Williams', email: 'sarah@example.com', role: 'CLIENT', status: 'Active', lastLogin: '2023-04-30' },
];

export default function AdminUsersPage() {
  const [users] = useState(mockUsers);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Create action buttons for header
  const headerActions = (
    <>
      <Button variant="outline" size="sm">
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
      <Button size="sm">
        <PlusCircle className="mr-2 h-4 w-4" />
        Add User
      </Button>
    </>
  );

  return (
    <PageLayout
      title="User Management"
      description="View and manage all users in the system"
      actions={headerActions}
    >
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle>Users</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <CardDescription>
            Showing {filteredUsers.length} of {users.length} users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'SUPER_ADMIN' ? 'default' : 'outline'}>
                      {user.role === 'SUPER_ADMIN' ? 'Admin' : 'Client'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.lastLogin}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PageLayout>
  );
} 