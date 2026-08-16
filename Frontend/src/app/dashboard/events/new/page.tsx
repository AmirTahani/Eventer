'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import MenuItem from '@mui/material/MenuItem';

const steps = [
  'Basics',
  'DJs',
  'Location',
  'Schedule & Capacity',
  'Pricing',
  'Access',
  'Review',
];

export default function CreateEventPage() {
  const [active, setActive] = useState(0);
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState(100);
  const [price, setPrice] = useState('50.00');
  const [visibility, setVisibility] = useState('ALL_APPROVED');

  return (
    <Stack spacing={3} maxWidth={720}>
      <Typography variant="h3">Create Event</Typography>
      <Stepper activeStep={active} alternativeLabel>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box>
        {active === 0 && (
          <Stack spacing={2}>
            <TextField
              label="Event name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              fullWidth
            />
            <TextField label="Description" multiline minRows={3} fullWidth />
            <TextField label="Dress code" fullWidth />
          </Stack>
        )}
        {active === 3 && (
          <Stack spacing={2}>
            <TextField
              label="Capacity"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
            />
            <TextField label="Start at" type="datetime-local" InputLabelProps={{ shrink: true }} />
            <TextField label="End at" type="datetime-local" InputLabelProps={{ shrink: true }} />
          </Stack>
        )}
        {active === 4 && (
          <Stack spacing={2}>
            <TextField
              label="Base price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <Typography color="text.secondary" variant="body2">
              Optional pricing tiers can be added after save via the event editor.
            </Typography>
          </Stack>
        )}
        {active === 5 && (
          <TextField
            select
            label="Visibility"
            value={visibility}
            onChange={(e) => setVisibility(e.target.value)}
            fullWidth
          >
            <MenuItem value="ALL_APPROVED">All approved users</MenuItem>
            <MenuItem value="SELECTED_USERS">Selected users</MenuItem>
            <MenuItem value="SELECTED_VOUCHERS">Selected vouchers</MenuItem>
            <MenuItem value="INVITE_ONLY">Invite only</MenuItem>
          </TextField>
        )}
        {active === 6 && (
          <Typography>
            Review: {name || 'Untitled'} · capacity {capacity} · {price} ·{' '}
            {visibility}
          </Typography>
        )}
        {(active === 1 || active === 2) && (
          <Typography color="text.secondary">
            Select or create from the shared pool (wired to API in this milestone).
          </Typography>
        )}
      </Box>

      <Stack direction="row" spacing={1}>
        <Button disabled={active === 0} onClick={() => setActive((s) => s - 1)}>
          Back
        </Button>
        {active < steps.length - 1 ? (
          <Button variant="contained" onClick={() => setActive((s) => s + 1)}>
            Next
          </Button>
        ) : (
          <Button variant="contained">Save as Draft</Button>
        )}
      </Stack>
    </Stack>
  );
}
