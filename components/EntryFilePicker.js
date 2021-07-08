import React, { useState } from 'react';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { createFilterOptions } from '@material-ui/lab';
import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';

const EMPTY_ARRAY = [];

//did not understand this function's use
function getUniqueMatches(matches) {
  return [...new Set(matches.map(([a, b]) => `${a}-${b}`))].map((v) => v.split('-').map(Number));
}

//did not understand this function's use
function getSegments(option) {
  const { name } = option;
  const matches = getUniqueMatches(option.matches[0].indices);

  const list = [{ value: name.substring(0, matches?.[0]?.[0]), isHiglight: false }];

  for (let i = 0; i < matches.length; i++) {
    const mat = matches[i];
    if (i > 0 && mat[0] < matches[i - 1][0]) {
      break;
    }
    list.push({ value: name.substring(mat[0], mat[1]), isHiglight: true });
    list.push({
      value: name.substring(mat[1], matches[i + 1]?.[0]),
      isHiglight: false,
    });
  }

  return list;
}

const useStyles = makeStyles((theme) => ({
  title: {
    flex: '0 0 auto',
    marginRight: theme.spacing(2),
    // marginBottom: '-6px'
  },
}));

export function EntryFilePicker({ entryFile, onEntryFileChange, className, allFiles }) {
  console.log('entryfile started to render');
  const classes = useStyles();
  const [searchKeyword, setSearchKeyword] = useState(entryFile?.filepath || '');
  const data = allFiles;
  const [open, setOpen] = React.useState(false);
  const defaultFilterFiles = createFilterOptions();

  return (
    <Box className={className} display="flex" alignItems="flex-end" mb={2}>
      <Autocomplete
        id="asynchronous-demo"
        style={{ width: '100%' }}
        // review the below ones
        value={entryFile}
        options={data || EMPTY_ARRAY}
        onChange={(event, newValue) => {
          console.log(newValue);
          onEntryFileChange(newValue);
        }}
        open={open}
        onOpen={() => {
          setOpen(true);
        }}
        onClose={() => {
          setOpen(false);
        }}
        inputValue={searchKeyword}
        onInputChange={(event, newInputValue) => {
          setSearchKeyword(newInputValue);
        }}
        filterOptions={(options, state) => {
          return defaultFilterFiles(options, state).slice(0, 20);
        }}
        getOptionLabel={(option) => option.name}
        getOptionSelected={(option, value) => option === value}
        renderInput={(params) => <TextField {...params} variant="outlined" label="Pick Entry" />}
      />
    </Box>
  );
}
