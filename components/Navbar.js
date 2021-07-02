import { Box, Button, makeStyles, Typography } from '@material-ui/core';
import Link from 'next/link';

const useStyles = makeStyles({
  header: {
    padding: '10px 10px',
    display: 'flex',
  },
  link: {
    width: '50px',
  },
});

const Navbar = () => {
  const classes = useStyles();
  return (
    <nav className={classes.header}>
      <div className={classes.link}>
        <Link href="/">Home</Link>
      </div>
      <div className={classes.link}>
        <Link href="/dashboard">DashBoard</Link>
      </div>
    </nav>
  );
};

export default Navbar;
