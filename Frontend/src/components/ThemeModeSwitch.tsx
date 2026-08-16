'use client';

import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Tooltip from '@mui/material/Tooltip';
import { useColorMode } from '@/theme/color-mode';

type Props = {
  /** Compact icon+switch for app bars */
  dense?: boolean;
};

export function ThemeModeSwitch({ dense = true }: Props) {
  const { mode, toggleMode, ready } = useColorMode();
  const isDark = mode === 'dark';

  return (
    <Tooltip title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{ opacity: ready ? 1 : 0.5 }}
      >
        <LightModeOutlinedIcon
          sx={{ fontSize: dense ? 18 : 20, color: 'text.secondary' }}
        />
        <FormControlLabel
          sx={{ m: 0 }}
          control={
            <Switch
              size="small"
              checked={isDark}
              onChange={toggleMode}
              inputProps={{ 'aria-label': 'Toggle dark mode' }}
              color="primary"
            />
          }
          label=""
        />
        <DarkModeOutlinedIcon
          sx={{ fontSize: dense ? 18 : 20, color: 'text.secondary' }}
        />
      </Stack>
    </Tooltip>
  );
}
