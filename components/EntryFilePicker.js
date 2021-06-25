import React, { useState } from "react";

import { useFileSearchQuery } from "../hooks/api/useFileSearchQuery";

import Typography from "@material-ui/core/Typography";
import TextField from "@material-ui/core/TextField";
import Autocomplete from "@material-ui/lab/Autocomplete";
import CircularProgress from "@material-ui/core/CircularProgress";
import Box from "@material-ui/core/Box";
import { makeStyles } from "@material-ui/core/styles";

const EMPTY_ARRAY = [];

function getUniqueMatches(matches) {
	return [...new Set(matches.map(([a, b]) => `${a}-${b}`))].map((v) =>
		v.split("-").map(Number)
	);
}

function getSegments(option) {
	const { name } = option;
	const matches = getUniqueMatches(option.matches[0].indices);

	const list = [
		{ value: name.substring(0, matches?.[0]?.[0]), isHiglight: false },
	];

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
		flex: "0 0 auto",
		marginRight: theme.spacing(2),
		// marginBottom: '-6px'
	},
}));

export function EntryFilePicker({ entryFile, onEntryFileChange, className }) {
	const classes = useStyles();
	const [searchKeyword, setSearchKeyword] = useState(entryFile?.name || "");
	const { data, status } = useFileSearchQuery(searchKeyword);
	const [open, setOpen] = React.useState(false);
	const loading = status === "loading";

	return (
		<Box className={className} display="flex" alignItems="flex-end" mb={2}>
			<Typography
				variant="h5"
				color="primary"
				className={classes.title}
			>
				Entry
			</Typography>
			<Autocomplete
				id="asynchronous-demo"
				style={{ width: "100%" }}
				value={entryFile}
				onChange={(event, newValue) => {
					onEntryFileChange(newValue || { filepath: "", name: "" });
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
				getOptionSelected={(option, value) => option.name === value.name}
				options={data || EMPTY_ARRAY}
				loading={loading}
				renderInput={(params) => (
					<TextField
						{...params}
						label="Search files"
						InputProps={{
							...params.InputProps,
							endAdornment: (
								<React.Fragment>
									{loading ? (
										<CircularProgress color="inherit" size={20} />
									) : null}
									{params.InputProps.endAdornment}
								</React.Fragment>
							),
						}}
					/>
				)}
				// renderOption={(option) => {
				// 	return (
				// 		<Typography key={option.name}>{option.name}</Typography>
				// 	)
				// 	console.log(option);
				// 	const segments = getSegments(option);
				// 	console.log(option);
				// 	return (
				// 		<Typography key={option.name}>
				// 			{segments.map((segment, index) =>
				// 				segment.isHiglight ? (
				// 					<Typography display="inline" key={index} color="primary">
				// 						{segment.value}
				// 					</Typography>
				// 				) : (
				// 					<span>{segment.value}</span>
				// 				)
				// 			)}
				// 		</Typography>
				// 	);
				// }}
			/>
		</Box>
	);
}
