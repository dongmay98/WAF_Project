import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  Box,
  Menu,
  MenuItem,
  IconButton,
  Chip,
  Divider,
} from '@mui/material';
import { AccountCircle, Logout, Business, Star } from '@mui/icons-material';
import { useAuthStore } from '../stores/authStore';

const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          WAF Dashboard
        </Typography>
        
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* 테넌트 정보 */}
            {user.tenant && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Business fontSize="small" />
                <Typography variant="body2" sx={{ color: 'inherit' }}>
                  {user.tenant.name || '조직'}
                </Typography>
                {user.tenant.subscription?.plan && (
                  <Chip
                    label={user.tenant.subscription.plan.toUpperCase()}
                    size="small"
                    color={user.tenant.subscription.plan === 'enterprise' ? 'warning' : 
                           user.tenant.subscription.plan === 'pro' ? 'secondary' : 'default'}
                    icon={user.tenant.subscription.plan === 'enterprise' ? <Star /> : undefined}
                  />
                )}
              </Box>
            )}
            
            <Typography variant="body2">
              {user.name} ({user.role || 'unknown'})
            </Typography>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
            >
              {user.picture ? (
                <Avatar src={user.picture} sx={{ width: 32, height: 32 }} />
              ) : (
                <AccountCircle />
              )}
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={handleClose}>
                <Typography variant="body2">{user.email}</Typography>
              </MenuItem>
              <MenuItem onClick={handleClose}>
                <Typography variant="body2" color="text.secondary">
                  Role: {user.role}
                </Typography>
              </MenuItem>
              {user.tenant && (
                <>
                  <Divider />
                  <MenuItem onClick={handleClose}>
                    <Box>
                      <Typography variant="body2" fontWeight="bold">
                        {user.tenant.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Plan: {user.tenant.subscription.plan} | 
                        {user.tenant.subscription.limits.logs_per_month} logs/month
                      </Typography>
                    </Box>
                  </MenuItem>
                </>
              )}
              <Divider />
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} />
                로그아웃
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Header;
