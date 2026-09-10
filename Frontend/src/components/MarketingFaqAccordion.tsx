'use client';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export function MarketingFaqAccordion({
  items,
}: {
  items: ReadonlyArray<{ question: string; answer: string }>;
}) {
  return (
    <Box
      sx={{
        borderRadius: 2,
        border: 1,
        borderColor: 'divider',
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      {items.map((item, index) => (
        <Accordion
          key={item.question}
          disableGutters
          elevation={0}
          defaultExpanded={index === 0}
          sx={{
            bgcolor: 'transparent',
            '&:before': { display: 'none' },
            borderBottom: index < items.length - 1 ? 1 : 0,
            borderColor: 'divider',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            aria-controls={`faq-panel-${index}-content`}
            id={`faq-panel-${index}-header`}
            sx={{
              px: { xs: 2, sm: 2.5 },
              py: 0.5,
              minHeight: 56,
              '& .MuiAccordionSummary-content': { my: 1.5 },
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 600, pr: 1, lineHeight: 1.4 }}
            >
              {item.question}
            </Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{ px: { xs: 2, sm: 2.5 }, pt: 0, pb: 2.5 }}
          >
            <Typography color="text.secondary" sx={{ lineHeight: 1.65 }}>
              {item.answer}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
