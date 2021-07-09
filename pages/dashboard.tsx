import React, { useEffect, useState } from 'react';
import Box from '@material-ui/core/Box';
import Layout from '../components/Layout';
import { useFetch } from '../components/customHooks/useFetch';

import Collection from '../components/Collection';
import Skeleton from '@material-ui/lab/Skeleton';

function Dashboard() {
  const { data: dataReceived, loading: dataLoading } = useFetch('api/collection/list');
  return (
    <Box>
      <Layout>{dataLoading ? <Skeleton /> : <Collection dataReceived={dataReceived} />}</Layout>
    </Box>
  );
}

export default Dashboard;
