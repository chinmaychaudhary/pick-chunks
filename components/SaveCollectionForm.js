import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { Button } from '@material-ui/core';

const createPostReqOptions = (obj) => {
  return {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj),
  };
};

export default function SaveCollectionForm({
  isDialog,
  setIsDialog,
  selectedChunks,
  snackBarMessage,
  setSnackbarVisibility,
}) {
  const [collectionDescription, setCollectionDescription] = useState('');
  const [collectionName, setCollectionName] = useState();

  const handleSaveCollection = (e) => {
    e.preventDefault();
    if (!collectionName) {
      return;
    }
    const collectionData = {
      name: collectionName,
      description: collectionDescription,
      chunks: [...selectedChunks],
    };
    fetch('/api/collection/add', createPostReqOptions(collectionData))
      .then(() => {
        snackBarMessage.current = `Collection saved !`;
        setSnackbarVisibility(true);
        setIsDialog(false);
      })
      .catch((err) => {
        snackBarMessage.current = `Unable to save the collection !`;
        setSnackbarVisibility(true);
      });
  };

  return (
    <Dialog
      fullWidth={true}
      open={isDialog}
      onClose={() => {
        setIsDialog(false);
      }}
    >
      <DialogTitle>Save Collection</DialogTitle>
      <DialogContent>
        <TextField
          label="Name"
          value={collectionName}
          onChange={(e) => setCollectionName(e.target.value)}
          variant="outlined"
          fullWidth={true}
          required
          margin="normal"
        />
        <TextField
          label="Description"
          variant="outlined"
          fullWidth={true}
          value={collectionDescription}
          onChange={(e) => setCollectionDescription(e.target.value)}
          margin="normal"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleSaveCollection} disabled={!collectionName} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
