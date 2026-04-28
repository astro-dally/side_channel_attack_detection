#!/bin/bash

# Define the hardware events we want to track
EVENTS="cache-misses,cache-references,instructions,cycles,branches,branch-misses"

# Define output file
OUTPUT_FILE="data/dataset.csv"

echo "Collecting HPC data every 50ms..."
echo "Press Ctrl+C to stop."

# Run perf
# -e : events to track
# -I 50 : 50ms intervals
# -x , : use comma as CSV separator
# -a : monitor all CPUs globally
sudo perf stat -e $EVENTS -I 50 -x , -o $OUTPUT_FILE --append -a
