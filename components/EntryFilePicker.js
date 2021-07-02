import React, { useState } from 'react';

import { useFileSearchQuery } from '../hooks/api/useFileSearchQuery';

import Typography from '@material-ui/core/Typography';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import CircularProgress from '@material-ui/core/CircularProgress';
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
  return (
    <Box className={className} display="flex" alignItems="flex-end" mb={2}>
      <Typography variant="h5" color="primary" className={classes.title}>
        Entry
      </Typography>
      <Autocomplete
        id="asynchronous-demo"
        style={{ width: '100%' }}
        // review the below ones
        value={entryFile}
        options={data || EMPTY_ARRAY}
        onChange={(event, newValue) => {
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
        getOptionLabel={(option) => option.name}
        getOptionSelected={(option, value) => option === value}
        renderInput={(params) => <TextField {...params} variant="outlined" label="Search files" />}
      />
    </Box>
  );
}
