import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import Navbar from '../components/Navbar';
import { flexbox } from '@material-ui/system';

const useStyles = makeStyles({
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
});

import { useFetch } from '../components/customHooks/useFetch';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { FixedSizeList } from 'react-window';
import { Checkbox, Chip, List } from '@material-ui/core';
import { motion } from 'framer-motion';

const getChunksfromName = (objects: null | { name: string; description: string; chunks: string[] }[], name: string) => {
  if (!name) {
    console.log('Choose an item');
    return <div>Choose an item!</div>;
  }
  if (!objects) {
    console.log('No Collection available yet!');
    return <div>No Collection available yet!</div>;
  }
  const chosenItemObject = objects.find((object) => object.name === name);
  const chunks = chosenItemObject?.chunks;

  return chunks?.map((chunk: string) => (
    <motion.div key={chunk} style={{ display: 'inline-block' }} animate={{ scale: 1 }} initial={{ scale: 0.5 }}>
      <Chip label={chunk} variant="outlined" data-chunk-name={chunk} />
    </motion.div>
  ));
};

function Dashboard() {
  const classes = useStyles();
  const { data: dataReceived, loading: dataLoading } = useFetch('api/collection/list');

  const [chosenItem, setChosenItem] = useState({
    name: '',
  });

  const chooseCollection = (name: string) => {
    setChosenItem({
      name: name,
    });
  };

  const previewChips = getChunksfromName(dataReceived, chosenItem.name);

  //console.log(dataReceived);
  return (
    <Box className={classes.mainContent} p={5}>
      <Navbar />
      {dataLoading ? null : (
        <Box display="flex" flexDirection="row" justifyContent="space-evenly" m={1} bgcolor="background.paper">
          <Box width="40%" border="1px dotted red">
            Hi, list Box
            <List className={classes.list} component="nav">
              {!dataReceived ? (
                <div>Make Collections To See Them Here</div>
              ) : (
                dataReceived.map((item: { name: string }) => (
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
                ))
              )}
            </List>
          </Box>
          <Box overflow="auto" width="40%" border="1px dotted red">
            Hi, preview Box
            <Box>{previewChips}</Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default Dashboard;
