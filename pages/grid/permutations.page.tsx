// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import clsx from "clsx";
import Grid from "../../lib/components/internal/grid";
import { chess, jenga, cross, dashboard } from "./layouts";

import classnames from "./permutations.module.css";

export default function GridPage() {
  return (
    <>
      <header>
        <h1>Grid</h1>
      </header>
      <main>
        <section>
          <Grid layout={chess} columns={4} rows={4}>
            {chess.map((stone) => (
              <Stone key={stone.id} index={chess.indexOf(stone)} />
            ))}
          </Grid>
          <Grid layout={jenga} columns={4} rows={5}>
            {jenga.map((block) => (
              <Block key={block.id} />
            ))}
          </Grid>
          <Grid layout={cross} columns={4} rows={4}>
            {cross.map((pixel) => (
              <Pixel key={pixel.id} />
            ))}
          </Grid>
          <Grid layout={dashboard} columns={4} rows={16}>
            {dashboard.map((dummy) => (
              <Dummy key={dummy.id} />
            ))}
          </Grid>
        </section>
      </main>
    </>
  );
}

const Stone = ({ index }: { index: number }) => {
  const row = Math.floor(index / 4);
  const black = index % 2 !== row % 2;
  return black ? <Black /> : <White />;
};

const Black = () => <div className={clsx(classnames.stone, classnames.black)} />;
const White = () => <div className={clsx(classnames.stone, classnames.white)} />;
const Block = () => <div className={classnames.block} />;
const Pixel = () => <div className={classnames.pixel} />;
const Dummy = () => <div className={classnames.dummy} />;
