import React, { useState } from 'react';

import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { createFilterOptions } from '@material-ui/lab';
import Box from '@material-ui/core/Box';

const EMPTY_ARRAY = [];

export function EntryFilePicker({ entryFile, onEntryFileChange, className, allFiles }) {
  const [searchKeyword, setSearchKeyword] = useState(entryFile?.filepath || '');
  const [open, setOpen] = React.useState(false);
  const defaultFilterFiles = createFilterOptions();

  return (
    <Box className={className} display="flex" alignItems="flex-end" mb={2}>
      <Autocomplete
        style={{ width: '100%' }}
        value={entryFile}
        options={allFiles || EMPTY_ARRAY}
        open={open}
        onOpen={() => {
          setOpen(true);
        }}
        onClose={() => {
          setOpen(false);
        }}
        inputValue={searchKeyword}
        // when selected file changes, we call the entryFileChange and tell the index page that entryfile has changed
        onChange={(event, newValue) => {
          onEntryFileChange(newValue);
        }}
        // when search keyword changes inside the textfield
        onInputChange={(event, newInputValue) => {
          setSearchKeyword(newInputValue);
        }}
        // A filter function that determines the options that are eligible. We used only first 100 results,
        // assuming user wont scroll more than that, rather will prefer search
        filterOptions={(options, state) => {
          return defaultFilterFiles(options, state).slice(0, 100);
        }}
        // data to show in textfield i.e. input
        getOptionLabel={(option) => option.name}
        // Used to determine if an option is selected, Uses strict equality by default.
        getOptionSelected={(option, value) => option === value}
        renderInput={(params) => <TextField {...params} variant="outlined" label="Pick Entry" />}
      />
    </Box>
  );
}
