import { loadDataset } from "./data-loader.ts";
import { generateOutputCsv } from "./pipeline.ts";

const dataset = await loadDataset();
const rows = await generateOutputCsv(dataset);
console.log(`Wrote ${rows.length} predictions to dataset/output.csv.`);
