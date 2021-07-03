import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import { flexbox } from '@material-ui/system';
import { TextField } from '@material-ui/core';
const useStyles = makeStyles((theme) => ({
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    height: '90vh',
  },
  collectionContainer: {
    display: 'flex',
    flexDirection: 'row',
  },
  halfBox: {
    width: '40%',
    height: '80vh',
    border: '1px solid red',
    justifyContent: 'spaceBetween',
  },
  list: {
    width: '100%',
    overflow: 'auto',
    maxHeight: '400px',
  },
  logo: {
    flex: '0 0 auto',
    height: 44,
    width: 44,
    marginRight: theme.spacing(2),
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    flex: '0 0 auto',
    justifyContent: 'space-between',
  },
  listRoot: {
    backgroundColor: theme.palette.background.paper,
  },
}));

import { useFetch } from '../components/customHooks/useFetch';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { FixedSizeList } from 'react-window';
import { Checkbox, Chip, List } from '@material-ui/core';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';
import Typography from '@material-ui/core/Typography';
import { Logo } from '../components/icons/Logo';
import { borders } from '@material-ui/system';
import FuzzySearch from 'fuzzy-search';
import { DescriptionTwoTone } from '@material-ui/icons';

function isEmpty(str: string) {
  return !str || str.length === 0;
}
// works clean
const getChunksfromName = (objects: null | { name: string; description: string; chunks: string[] }[], name: string) => {
  if (isEmpty(name)) {
    console.log('Choose an item');
    return <div>Choose a Collection!</div>;
  }
  if (!objects) {
    console.log('No Collection available yet!');
    return <div>No Collection available yet!</div>;
  }
  const chosenItemObject = objects.find((object) => object.name === name);
  const chunks = chosenItemObject?.chunks;

  return chunks?.map((chunk: string) => (
    <motion.div key={chunk} style={{ display: 'inline-block' }} animate={{ scale: 1 }} initial={{ scale: 0.5 }}>
      <Box p={1}>
        <Chip label={chunk} variant="outlined" data-chunk-name={chunk} />
      </Box>
    </motion.div>
  ));
};
const getDescriptionFromName = (objects: any[] | null, name: string) => {
  if (isEmpty(name) || !objects) {
    return '';
  }
  const chosenItemObject = objects.find((object: { name: any }) => object.name === name);
  const description = chosenItemObject?.description;
  return description;
};

function Dashboard() {
  const classes = useStyles();
  const { data: dataReceived, loading: dataLoading } = useFetch('api/collection/list');

  const [chosenItem, setChosenItem] = useState({ name: '' });

  const chooseCollection = (name: string) => {
    setChosenItem({ name: name });
  };

  const previewChips = getChunksfromName(dataReceived, chosenItem.name);
  const description = getDescriptionFromName(dataReceived, chosenItem.name);
  // FUZZY SEARCH
  const fuzSearch = useMemo(() => {
    return new FuzzySearch(dataReceived, ['name']);
  }, [dataReceived]);

  const [keyword, setKeyword] = useState('');
  const filteredCollection = keyword ? fuzSearch.search(keyword) : dataReceived;
  console.log(filteredCollection);

  return (
    <Box>
      <Layout>
        <Box className={classes.mainContent} p={5}>
          <Box className={classes.header} borderRadius={8}>
            <Box display="flex" flexDirection="row" flex="0 0 auto" justifyContent="flex-start" alignItems="flex-start">
              <Logo className={classes.logo} />
              <Typography variant="h5" color="textPrimary">
                Pick Chunks
              </Typography>
            </Box>
          </Box>
          {dataLoading ? null : (
            <Box
              display="flex"
              flexDirection="column"
              justifyContent="flex-start"
              m={1}
              borderRadius="borderRadius"
              minHeight="50vh"
            >
              <Box display="flex" justifyContent="space-between" m={1}>
                {/*input field for to search for a Collection*/}
                <TextField
                  variant="outlined"
                  style={{ marginBottom: '20px', width: '35%' }}
                  label="Search Collection"
                  value={keyword}
                  onChange={(e) => {
                    setKeyword(e.target.value);
                  }}
                />
                <TextField
                  variant="outlined"
                  label="Description"
                  value={description}
                  style={{ marginBottom: '20px', width: '60%' }}
                />
              </Box>
              <Box display="flex" flexDirection="row" justifyContent="space-between" flexGrow={1}>
                <Box
                  width="35%"
                  //border="1px solid white"
                  borderRadius="borderRadius"
                  className={classes.listRoot}
                  m={1}
                >
                  {!filteredCollection ? (
                    <div>Make Collections To See Them Here</div>
                  ) : (
                    <List className={classes.list} component="nav">
                      {filteredCollection.map((item) => (
                        <ListItem
                          button
                          onClick={() => {
                            chooseCollection(item.name);
                          }}
                          key={item.name}
                          data-name={item.name}
                          selected={chosenItem.name === item.name}
                        >
                          <ListItemText primary={item.name} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </Box>
                <Box
                  overflow="auto"
                  width="60%"
                  borderRadius="borderRadius"
                  border="1px solid white"
                  color="primary.main"
                  m={1}
                >
                  <Box borderRadius="borderRadius" borderColor="primary.main" p={1} overflow="auto">
                    {previewChips}
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      </Layout>
    </Box>
  );
}

export default Dashboard;
