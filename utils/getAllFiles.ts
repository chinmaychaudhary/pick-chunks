import glob from "glob-promise";

export const getAllFiles = async (cwd = process.cwd(), query = "") => {
    const files = await glob(cwd + `/**/*${query}*.+(js|ts|tsx)`);
    return files.filter(file => !file.includes('node_modules'));
}