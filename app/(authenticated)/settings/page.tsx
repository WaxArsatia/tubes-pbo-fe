'use client';

export const dynamic = 'force-dynamic';

/**
 * User Settings Page
 * Implements Profile, Security, and Account Info sections
 * Reference: docs/04_SETTINGS_FRONTEND.md
 */

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/page-header';
import { LoadingSpinner } from '@/components/loading-spinner';
import { ErrorMessage } from '@/components/error-message';
import { useAuth } from '@/hooks/use-auth';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import type { ApiResponse } from '@/lib/types/api.types';

interface ProfileFormData {
  name: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ProfileResponse {
  id: number;
  email: string;
  name: string;
  role: 'USER' | 'ADMIN';
  createdAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user: authUser, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Profile state
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileFormData>({ name: '' });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string>('');

  // Password state
  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // Load profile data on mount
  const loadProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await apiClient.get<ApiResponse<ProfileResponse>>('/settings');
      const data = response.data.data;
      setProfileData(data);
      setProfileForm({ name: data.name });
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Failed to load profile';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Profile form handlers
  const handleProfileChange = (field: keyof ProfileFormData, value: string) => {
    setProfileForm((prev) => ({ ...prev, [field]: value }));
    setProfileError('');
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!profileForm.name.trim()) {
      setProfileError('Name is required');
      return;
    }
    if (profileForm.name.length > 255) {
      setProfileError('Name must not exceed 255 characters');
      return;
    }

    try {
      setIsUpdatingProfile(true);
      setProfileError('');
      
      const response = await apiClient.put<ApiResponse<{ name: string }>>('/settings', {
        name: profileForm.name,
      });

      // Update localStorage and context
      updateUser({ name: response.data.data.name });
      
      // Update local state
      if (profileData) {
        setProfileData({ ...profileData, name: response.data.data.name });
      }

      toast.success('Profile updated successfully');
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      const errorMessage = error.response?.data?.message || 'Failed to update profile';
      setProfileError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Password form handlers
  const handlePasswordChange = (field: keyof PasswordFormData, value: string) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user types
    setPasswordErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validatePasswordForm = (): boolean => {
    const errors: typeof passwordErrors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    }
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      return;
    }

    try {
      setIsChangingPassword(true);

      await apiClient.put('/settings/password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      toast.success('Password changed successfully. Logging out...');

      // Clear form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Logout after 2 seconds
      setTimeout(() => {
        logout();
        router.push('/login');
      }, 2000);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string }, status?: number } };
      const errorMessage = error.response?.data?.message || 'Failed to change password';
      if (
        error.response?.status === 400 &&
        errorMessage.includes('password incorrect')
      ) {
        setPasswordErrors({ currentPassword: 'Current password is incorrect' });
      }
      toast.error(errorMessage);
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !profileData) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <PageHeader title="Settings" description="Manage your account settings" />
        <ErrorMessage message={error} retry={loadProfile} />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <PageHeader title="Settings" description="Manage your account settings" />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="account">Account Info</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                <Field>
                  <FieldLabel>Name</FieldLabel>
                  <Input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) => handleProfileChange('name', e.target.value)}
                    placeholder="Enter your name"
                    maxLength={255}
                    aria-invalid={!!profileError}
                  />
                  <FieldDescription>Your display name (max 255 characters)</FieldDescription>
                  {profileError && <FieldError>{profileError}</FieldError>}
                </Field>

                <Field>
                  <FieldLabel>Email</FieldLabel>
                  <Input
                    type="email"
                    value={profileData?.email || ''}
                    disabled
                    className="bg-muted cursor-not-allowed"
                  />
                  <FieldDescription>Email cannot be changed</FieldDescription>
                </Field>

                <div className="flex justify-end pt-4">
                  <Button type="submit" disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Update your password to keep your account secure</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm">
                  <div className="flex gap-2">
                    <span className="text-destructive">⚠️</span>
                    <span className="text-muted-foreground">
                      Changing your password will log you out of all devices
                    </span>
                  </div>
                </div>

                <Field>
                  <FieldLabel>Current Password</FieldLabel>
                  <Input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                    placeholder="Enter current password"
                    aria-invalid={!!passwordErrors.currentPassword}
                  />
                  {passwordErrors.currentPassword && (
                    <FieldError>{passwordErrors.currentPassword}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel>New Password</FieldLabel>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    placeholder="Enter new password"
                    aria-invalid={!!passwordErrors.newPassword}
                  />
                  <FieldDescription>Must be at least 8 characters</FieldDescription>
                  {passwordErrors.newPassword && (
                    <FieldError>{passwordErrors.newPassword}</FieldError>
                  )}
                </Field>

                <Field>
                  <FieldLabel>Confirm New Password</FieldLabel>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    placeholder="Confirm new password"
                    aria-invalid={!!passwordErrors.confirmPassword}
                  />
                  {passwordErrors.confirmPassword && (
                    <FieldError>{passwordErrors.confirmPassword}</FieldError>
                  )}
                </Field>

                <div className="flex justify-end pt-4">
                  <Button type="submit" variant="destructive" disabled={isChangingPassword}>
                    {isChangingPassword ? 'Changing Password...' : 'Change Password'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Info Tab */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>View your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">User ID</div>
                <div className="text-base">{profileData?.id || authUser?.id || 'N/A'}</div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Role</div>
                <Badge variant={profileData?.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                  {profileData?.role || authUser?.role || 'USER'}
                </Badge>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Account Created</div>
                <div className="text-base">
                  {(() => {
                    if (profileData?.createdAt) return formatDate(profileData.createdAt);
                    if (authUser?.createdAt) return formatDate(authUser.createdAt);
                    return 'N/A';
                  })()}
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">Email</div>
                <div className="text-base">{profileData?.email || authUser?.email || 'N/A'}</div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
