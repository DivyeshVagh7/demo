import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/Input';
import { Label } from '@/Components/ui/Label';
import toast from 'react-hot-toast';

const PasswordModal = ({ isOpen, onOpenChange, user, onPasswordSubmit }) => {
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    new_password2: '',
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  useEffect(() => {
    // Reset form when modal opens or user changes
    if (isOpen) {
      setPasswordForm({
        current_password: '',
        new_password: '',
        new_password2: '',
      });
    }
  }, [isOpen, user]);

  const handlePasswordInputChange = (e) => {
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setPasswordSaving(true);
    try {
      if (passwordForm.new_password !== passwordForm.new_password2) {
        toast.error('New passwords do not match.');
        return;
      }
      if (passwordForm.new_password.length < 8) {
        toast.error('New password must be at least 8 characters long.');
        return;
      }

      let payload = {
        new_password: passwordForm.new_password,
        new_password2: passwordForm.new_password2,
      };
      let endpoint = '';
      
      if (user.auth_provider === 'google' && !user.has_password) {
        endpoint = 'api/auth/add-password/';
      } else {
        endpoint = 'api/auth/change-password/';
        payload.current_password = passwordForm.current_password;
      }

      if (endpoint === 'api/auth/change-password/' && !passwordForm.current_password.trim()) {
        toast.error('Current password cannot be empty.');
        return;
      }

      await onPasswordSubmit(payload, endpoint);
      onOpenChange(false); // Close modal on success
    } catch (error) {
      // Error handling is done in onPasswordSubmit (handleChangePassword)
    } finally {
      setPasswordSaving(false);
    }
  };

  const isAddPasswordMode = user.auth_provider === 'google' && !user.has_password;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isAddPasswordMode ? 'Add Password' : 'Change Password'}</DialogTitle>
          <DialogDescription>
            {isAddPasswordMode
              ? 'Set a password for your Google-authenticated account.'
              : 'Update your account password.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {!isAddPasswordMode && (
            <div className="space-y-2">
              <Label htmlFor="current_password">Current Password</Label>
              <Input
                id="current_password"
                name="current_password"
                type="password"
                value={passwordForm.current_password}
                onChange={handlePasswordInputChange}
                placeholder="Enter current password"
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="new_password">New Password</Label>
            <Input
              id="new_password"
              name="new_password"
              type="password"
              value={passwordForm.new_password}
              onChange={handlePasswordInputChange}
              placeholder="Enter new password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_password2">Confirm New Password</Label>
            <Input
              id="new_password2"
              name="new_password2"
              type="password"
              value={passwordForm.new_password2}
              onChange={handlePasswordInputChange}
              placeholder="Confirm new password"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={passwordSaving}>
            {passwordSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin mr-2"></div>
                {isAddPasswordMode ? 'Adding...' : 'Changing...'}
              </>
            ) : (
              isAddPasswordMode ? 'Add Password' : 'Change Password'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PasswordModal;
