const tacticalStand = (function () {
    let player, opponent, game, startPos, endPos, shipTypes;

    const levels = {
        0: "First Wave",
        1: "Second Wave",
        2: "Final Wave",
    };
    const State = {
        Positioning: 0,
        Targeting: 1,
        Firing: 2,
        Over: 3,
    };

    // Methods

    //#region Draw Methods.
    function DrawHit(ctx) {
        return function (row, column) {
            // Draw circle.
            DrawCircle(ctx)(
                row * game.cellSize,
                column * game.cellSize,
                game.cellSize,
                null,
                "Red",
                null,
                (game.cellSize / 2) * 0.4,
            );
        };
    }

    function DrawMiss(ctx) {
        return function (row, column) {
            // Draw circle.
            DrawCircle(ctx)(
                row * game.cellSize,
                column * game.cellSize,
                game.cellSize,
                null,
                "Blue",
                null,
                (game.cellSize / 2) * 0.4,
            );
        };
    }

    function DrawText(ctx) {
        return function (x, y, width, text, size, clear, color) {
            if (!size) {
                size = game.cellSize / 2;
            }
            if (clear) {
                ctx.beginPath();
                ctx.clearRect(x, y - size, width, size * 1.3);
                ctx.closePath();
            }

            ctx.beginPath();
            ctx.fillStyle = color ? color : "white";
            ctx.font = size + 'px "Courier New", Courier, monospace';
            ctx.fillText(text, x, y, width);
            ctx.closePath();
        };
    }

    function DrawMessage(ctx) {
        return function (text, color) {
            DrawText(ctx)(
                0,
                game.cellSize * 1.7,
                game.size * game.cellSize,
                text,
                game.cellSize / 2,
                true,
                color,
            );
        };
    }

    function DrawCell(ctx) {
        return function (row, column) {
            const x = row * game.cellSize;
            const y = column * game.cellSize;
            const width = game.cellSize;
            const height = game.cellSize;
            ctx.strokeStyle = "grey";

            ctx.beginPath();
            ctx.clearRect(x, y, width, height);
            ctx.strokeRect(x, y, width, height);
        };
    }

    function DrawCircle(ctx) {
        return function (x, y, size, text, color, offset, radius) {
            if (!radius) {
                radius = 27.5;
            }
            ctx.save();
            ctx.beginPath();
            gradient = ctx.createRadialGradient(
                x + size / 2 - 10,
                y + size / 2 - 5,
                0,
                x + size / 2 - 5,
                y + size / 2 - 5,
                radius + 7.5,
            );
            gradient.addColorStop(0, "white");
            gradient.addColorStop(1, color);
            ctx.beginPath();
            ctx.fillStyle = gradient;
            ctx.strokeStyle = "#ddd";
            ctx.lineWidth = radius > 20 ? radius * 0.18 : 4;
            ctx.arc(x + size / 2, y + size / 2, radius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();
            ctx.closePath();
            if (text) {
                DrawText(ctx)(
                    x + offset,
                    y + 35,
                    size,
                    text,
                    15,
                    false,
                    "black",
                );
            }
            ctx.restore();
        };
    }

    function drawButtons(ctx) {
        return function (name) {
            let offset, color, text;

            let x = 0;
            const y = 360;
            const size = game.cellSize * 2;
            const spacing = size + size / 3;

            for (x = 0; x < game.width; x += spacing) {
                text = "";

                switch (x) {
                    case 0:
                        color = "Green";
                        text = name === "opponent" ? "Fire" : "Next";
                        offset = 12;
                        break;
                    case spacing:
                        color = "Orange";
                        text =
                            name === "player" && game.state > State.Positioning
                                ? ""
                                : "Auto";
                        offset = 12;
                        break;
                    case spacing * 2:
                        color = "Red";
                        text = "Clear";
                        offset = 8;
                        break;
                    default:
                        color = "Pink";
                        text = "Switch";
                        offset = 2;
                        break;
                }

                if (text) {
                    DrawCircle(ctx)(x, y, size, text, color, offset);
                } else {
                    ctx.clearRect(
                        x * game.cellSize,
                        y * game.cellSize,
                        size,
                        size,
                    );
                }
            }
        };
    }

    function drawStartButton() {
        const ctx = document.querySelector("#startArea").getContext("2d");

        DrawCircle(ctx)(125, 100, 50, undefined, "green", 0, 50);
        DrawText(ctx)(105, 140, 90, "BEGIN", 45, false, "#272b30");
    }

    function drawPlayerStatus(ctx) {
        return function (text, color, name) {
            let data;

            if (name === "player") {
                data = player;
            } else {
                data = opponent;
            }

            // Draw status bars.
            ctx.save();
            ctx.beginPath();
            ctx.clearRect(0, 0, game.width / 2, game.cellSize);
            ctx.fillStyle = "Green";
            ctx.fillRect(
                0,
                2.5,
                -(game.cellSize / 2) * opponent.count + game.width / 2,
                10,
            );
            ctx.fillStyle = "Red";
            ctx.fillRect(
                0,
                17.5,
                -(game.cellSize / 2) * player.count + game.width / 2,
                10,
            );
            ctx.closePath();
            ctx.restore();

            // Draw ship counts.
            // clear
            ctx.clearRect(game.width / 2, 0, game.width, game.cellSize);
            for (let x = 5; x < 10; x += 1) {
                // draw ship part
                DrawShip(ctx)(x, 0, "v", x === 5 ? 0 : -1, false, true);
                if (x > 5 && x < 9) {
                    // draw top line
                    ctx.beginPath();
                    ctx.moveTo(x * game.cellSize, game.cellSize * 0.125);
                    ctx.lineTo(
                        x * game.cellSize + game.cellSize,
                        game.cellSize * 0.125,
                    );
                    ctx.stroke();
                    ctx.closePath();
                    // draw bottom line
                    ctx.beginPath();
                    ctx.moveTo(
                        x * game.cellSize,
                        game.cellSize - game.cellSize * 0.125,
                    );
                    ctx.lineTo(
                        x * game.cellSize + game.cellSize,
                        game.cellSize - game.cellSize * 0.125,
                    );
                    ctx.stroke();
                    ctx.closePath();
                }

                // draw ship counts
                if (x > 5) {
                    if (game.state === State.Positioning && name === "player") {
                        DrawText(ctx)(
                            x * game.cellSize + 2,
                            game.cellSize * 0.7,
                            game.cellSize,
                            data.available[x - 4],
                        );
                    } else {
                        DrawText(ctx)(
                            x * game.cellSize + 2,
                            game.cellSize * 0.7,
                            game.cellSize,
                            data.remaining[x - 4],
                        );
                    }
                }
            }

            // Write message.
            if (text) {
                if (!color) {
                    color = "White";
                }
                DrawMessage(ctx)(text, color);
            }
        };
    }

    function DrawSelect(ctx) {
        return function (row, column) {
            // Clear cell first.
            DrawCell(ctx)(row, column);

            const x = row * game.cellSize + 5;
            const y = column * game.cellSize + 5;
            const width = game.cellSize - 10;
            const height = game.cellSize - 10;
            ctx.fillStyle = "grey";

            ctx.beginPath();
            ctx.fillRect(x, y, width, height);
        };
    }

    function DrawShip(ctx) {
        return function (row, column, direction, position, fill, noBorder) {
            // Clear cell first.
            if (!noBorder) {
                DrawCell(ctx)(row, column);
            }

            const x = row * game.cellSize;
            const y = column * game.cellSize;

            ctx.save();
            ctx.fillStyle = "grey";
            ctx.lineStyle = "grey";

            // Draw from center.
            ctx.translate(x + game.cellSize / 2, y + game.cellSize / 2);

            if (direction === "v") {
                // Rotate.
                ctx.rotate(-0.5 * Math.PI);
            }

            ctx.beginPath();

            switch (position) {
                case 0:
                    // Front.
                    ctx.moveTo(game.cellSize * -0.375, game.cellSize * 0.5);
                    ctx.quadraticCurveTo(
                        game.cellSize * -0.375,
                        game.cellSize * -0.125,
                        0,
                        game.cellSize * -0.375,
                    );
                    ctx.stroke();
                    ctx.quadraticCurveTo(
                        game.cellSize * 0.375,
                        game.cellSize * -0.125,
                        game.cellSize * 0.375,
                        game.cellSize * 0.5,
                    );
                    ctx.stroke();
                    ctx.closePath();
                    break;
                case -1:
                    // Rear.
                    ctx.moveTo(game.cellSize * -0.375, game.cellSize * -0.5);
                    ctx.bezierCurveTo(
                        game.cellSize * -0.375,
                        game.cellSize * 0.5,
                        game.cellSize * 0.375,
                        game.cellSize * 0.5,
                        game.cellSize * 0.375,
                        game.cellSize * -0.5,
                    );
                    ctx.stroke();
                    ctx.closePath();
                    break;
                default:
                    if (fill) {
                        ctx.fillRect(
                            game.cellSize * -0.375,
                            game.cellSize * -0.5,
                            game.cellSize * 0.75,
                            game.cellSize,
                        );
                    } else {
                        ctx.strokeRect(
                            game.cellSize * -0.375,
                            game.cellSize * -0.5,
                            game.cellSize * 0.75,
                            game.cellSize,
                        );
                    }

                    ctx.closePath();
            }

            if (fill) {
                ctx.fill();
            }

            ctx.restore();
        };
    }

    function DrawTarget(ctx) {
        return function (row, column) {
            // Draw target on opponents grid.
            let x, y;

            // Clear cell first.
            DrawCell(ctx)(row, column);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "red";

            // Start at the top middle of the selected cell. Vertical line.
            x = row * game.cellSize + game.cellSize / 2;
            y = column * game.cellSize + 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + game.cellSize - 4);
            ctx.stroke();
            ctx.closePath();
            // Horizontal line.
            x = row * game.cellSize + 2;
            y = column * game.cellSize + game.cellSize / 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + game.cellSize - 4, y);
            ctx.stroke();
            ctx.closePath();
            // Draw circle.
            x = row * game.cellSize + game.cellSize / 2;
            y = column * game.cellSize + game.cellSize / 2;
            ctx.beginPath();
            ctx.arc(x, y, game.cellSize / 2 - 4, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.closePath();

            ctx.lineWidth = 1;
        };
    }

    function drawGrid(ctx) {
        return function (data, name) {
            for (let x = 0; x < data.length; x += 1) {
                // column
                for (let y = game.yOffset; y < data[x].length; y += 1) {
                    // row
                    const cell = data[x][y];

                    DrawCell(ctx)(x, y);
                    if (name === "player" && cell.shipID) {
                        DrawShip(ctx)(
                            x,
                            y,
                            cell.ship.direction,
                            cell.ship.position,
                        );
                    }
                    if (
                        name === "player" &&
                        cell.target &&
                        cell.turn === game.turn
                    ) {
                        DrawTarget(ctx)(x, y);
                    }
                    if (cell.hit) {
                        DrawHit(ctx)(x, y);
                    }
                    if (cell.target && cell.turn !== game.turn) {
                        DrawMiss(ctx)(x, y);
                    }
                }
            }

            drawPlayerStatus(ctx)(
                `${levels[game.level]}: Position your ships.`,
                "Green",
                name,
            );
        };
    }

    function Draw(canvas) {
        const ctx = canvas.getContext("2d");

        return {
            cell: DrawCell(ctx),
            target: DrawTarget(ctx),
            select: DrawSelect(ctx),
            hit: DrawHit(ctx),
            miss: DrawMiss(ctx),
            text: DrawText(ctx),
            ship: DrawShip(ctx),
            button: DrawCircle(ctx),
            buttons: drawButtons(ctx),
            grid: drawGrid(ctx),
            status: drawPlayerStatus(ctx),
            message: DrawMessage(ctx),
        };
    }

    //#endregion

    function GetTargetCount(data) {
        let count;
        count = 0;

        for (let r = 0; r < data.length; r++) {
            for (let c = game.yOffset; c < data[r].length; c++) {
                if (data[r][c].target && data[r][c].turn === game.turn) {
                    count += 1;
                }
            }
        }

        return count;
    }

    function SetTarget(opponent, row, column, show, count, setOnly) {
        const draw = new Draw(opponent.area);

        if (!opponent.grid[row][column].target) {
            if (show) {
                draw.target(row, column);
            }
            opponent.grid[row][column].target = true;
            opponent.grid[row][column].turn = game.turn;
            count -= 1;
        } else {
            if (setOnly) {
                draw.cell(row, column);
                opponent.grid[row][column].target = false;
                opponent.grid[row][column].turn = 0;
            }
        }

        return count;
    }

    function CreateGrid(player, rows, columns) {
        if (!columns) {
            // Create a square grid.
            columns = rows;
        }

        const draw = new Draw(player.area);
        const data = [];

        for (let x = 0; x < rows; x += 1) {
            // row
            data[x] = [];

            for (let y = game.yOffset; y < columns + game.yOffset; y += 1) {
                // column
                data[x][y] = {
                    ship: { id: 0, direction: "", position: 0 },
                    hit: false,
                    target: false,
                    turn: 0,
                };
            }
        }

        draw.grid(data, player.name);

        return data;
    }

    function ResetPlayer(name) {
        return {
            name: name,
            area: document.querySelector(`#${name}Area`),
            ships: [],
            count: 0,
            lastCount: 0,
            grid: [],
            available: {
                5: 2,
                4: 2,
                3: 4,
                2: 2,
            },
            remaining: {
                5: 2,
                4: 2,
                3: 4,
                2: 2,
            },
            score: { hits: 0, misses: 0 },
            RemainingTargets: function (level) {
                if (level > 1) return Math.round(this.count * 0.8);
                return this.count;
            },
        };
    }

    function ResetFleet() {
        let count = 0;

        for (let ship in player.available) {
            count += player.available[ship];
        }
    }

    function NewGame(background) {
        document.querySelector("#targetPanel").classList.add("hidden");
        if (!background) {
            document.querySelector("#playerMap").classList.remove("hidden");
        }

        game.state = State.Positioning;
        game.turn = 1;

        player = ResetPlayer("player");
        opponent = ResetPlayer("opponent");

        opponent.grid = CreateGrid(opponent, game.size);
        player.grid = CreateGrid(player, game.size);

        ResetFleet();
        CreateRandomFleet(opponent, false);
    }

    function HasShip(data, size) {
        for (let ship in data.available) {
            if (size.toString() === ship && data.available[ship] > 0) {
                return true;
            }
        }

        return;
    }

    function AddShip(player, x, y, direction, size, show) {
        const draw = new Draw(player.area);
        const id = player.count + 1;

        function Undo(count) {
            for (let i = count; i >= 0; i -= 1) {
                if (direction === "h") {
                    x -= 1;
                } else {
                    y -= 1;
                }

                draw.cell(x, y);
                player.grid[x][y].ship = {
                    id: 0,
                    direction: direction,
                    position: i === 0 ? 0 : i + 1 === size ? -1 : i,
                };
            }
        }

        for (let i = 0; i < size; i += 1) {
            if (player.grid[x][y].ship.id) {
                Undo(i - 1);
                return;
            }

            if (show) {
                draw.ship(
                    x,
                    y,
                    direction,
                    i < 1 ? 0 : i + 1 === size ? -1 : 1,
                    true,
                );
            }
            player.grid[x][y].ship = {
                id: id,
                direction: direction,
                position: i === 0 ? 0 : i + 1 === size ? -1 : i,
            };

            if (direction === "h") {
                y += 1;
            } else {
                x += 1;
            }
        }

        player.count += 1;
        player.ships[player.count] = { size: size, hits: 0 };
        player.available[size] -= 1;

        return id;
    }

    function CreateRandomIndex(gridSize) {
        return Math.floor(Math.random() * gridSize);
    }

    function GetPositionFromIndex(index) {
        const y = index % 10;
        const x = Math.floor(index / 10);

        return { x: x, y: y + game.yOffset };
    }

    function GetRandomPosition(player, size) {
        let x, y;

        const position = GetPositionFromIndex(
            CreateRandomIndex(game.size * game.size),
        );
        position.direction = Math.floor(Math.random() * 2) ? "h" : "v";

        if (position.direction === "h") {
            // Horizontal.
            if (position.y + size >= game.size - 1) {
                position.y = game.size - size - 1;
            }
        } else {
            // Vertical.
            if (position.x + size >= game.size - 1) {
                position.x = game.size - size - 1;
            }
        }

        x = position.x;
        y = position.y;

        for (let i = 0; i < size; i++) {
            if (player.grid[x][y].ship.id) {
                // Occupied.
                return GetRandomPosition(player, size);
            }
            if (position.direction === "h") {
                y += 1;
            } else {
                x += 1;
            }
        }

        return position;
    }

    function CreateRandomFleet(player, show) {
        for (let a in player.available) {
            const count = player.available[a];
            for (let i = 0; i < count; i += 1) {
                const position = GetRandomPosition(player, parseInt(a, 10));
                AddShip(
                    player,
                    position.x,
                    position.y,
                    position.direction,
                    parseInt(a, 10),
                    show,
                );
            }
        }
    }

    function GetRandomTargetPosition(grid) {
        const position = GetPositionFromIndex(
            CreateRandomIndex(game.size * game.size),
        );

        if (grid[position.x][position.y].target) {
            return GetRandomTargetPosition(grid);
        } else {
            return position;
        }
    }

    function GetFreeCellCount(grid, max) {
        let count = 0;

        for (let x in grid) {
            for (let y in grid[x]) {
                const cell = grid[x][y];

                if (!cell.target) {
                    count += 1;
                    if (count >= max) {
                        return max;
                    }
                }
            }
        }

        return count;
    }

    function CreateRandomTargets(player, opponent, show) {
        let count;

        if (player.name === "opponent" && game.level > 1) {
            count = GetFreeCellCount(
                opponent.grid,
                player.RemainingTargets(1) - GetTargetCount(opponent.grid),
            );
        } else {
            count = GetFreeCellCount(
                opponent.grid,
                player.RemainingTargets(game.level) -
                    GetTargetCount(opponent.grid),
            );
        }

        for (let i = 0; i < count; i += 1) {
            const position = GetRandomTargetPosition(opponent.grid);
            SetTarget(opponent, position.x, position.y, show, player.count);
        }
    }

    function ShowHits(grid, player, clear) {
        const draw = new Draw(player.area);
        let hits = 0;
        let misses = 0;

        // Show player hits.
        for (let x in grid) {
            for (let y in grid[x]) {
                if (grid[x][y].target && grid[x][y].turn === game.turn) {
                    if (clear) {
                        // Clear target.
                        draw.cell(x, y);
                    }
                    if (grid[x][y].ship.id) {
                        // Hit.
                        grid[x][y].hit = true;

                        draw.hit(x, y);
                        player.score.hits += 1;
                        hits += 1;
                    } else {
                        // Miss.
                        draw.miss(x, y);
                        player.score.misses += 1;
                        misses += 1;
                    }
                    grid[x][y].turn = game.turn;
                }
            }
        }

        return { hits: hits, misses: misses };
    }

    function UpdatePlayerShips(player) {
        for (let x in player.grid) {
            for (let y in player.grid[x]) {
                if (
                    player.grid[x][y].hit &&
                    player.grid[x][y].turn === game.turn
                ) {
                    const shipID = player.grid[x][y].ship.id;
                    player.ships[shipID].hits += 1;
                }
            }
        }

        let count = 0;

        player.lastCount = player.count;

        player.remaining = {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
        };

        for (i in player.ships) {
            if (player.ships[i].size > player.ships[i].hits) {
                count += 1;
                player.remaining[player.ships[i].size] += 1;
            }
        }
        player.count = count;
        return count;
    }

    function ShowDestroyedShips(grid, player) {
        const draw = new Draw(player.area);

        for (let x = 0; x < grid.length; x += 1) {
            for (let y = game.yOffset; y < grid[x].length; y += 1) {
                const cell = grid[x][y];
                const ship = player.ships[cell.ship.id];
                if (ship && ship.hits === ship.size) {
                    draw.ship(
                        x,
                        y,
                        cell.ship.direction,
                        cell.ship.position,
                        true,
                    );
                    draw.hit(x, y);
                }
            }
        }
    }

    function CreateCloseTargets(grid, opponent, player) {
        let count;

        if (player.name === "opponent" && game.level > 1) {
            count = GetFreeCellCount(opponent.grid, 10);
        } else {
            count = GetFreeCellCount(opponent.grid, player.count);
        }

        for (let x = 0; x < grid.length; x += 1) {
            for (let y = game.yOffset; y < grid[x].length; y += 1) {
                const cell = grid[x][y];
                const ship = opponent.ships[cell.ship.id];
                if (cell.hit && ship.hits < ship.size) {
                    if (x > 0) {
                        // Target before.
                        count = SetTarget(opponent, x - 1, y, false, count);
                    }
                    if (y > game.yOffset && count) {
                        // Target above.
                        count = SetTarget(opponent, x, y - 1, false, count);
                    }
                    if (x < 9 && count) {
                        // Target after.
                        count = SetTarget(opponent, x + 1, y, false, count);
                    }
                    if (y < 9 + game.yOffset && count) {
                        // Target below.
                        count = SetTarget(opponent, x, y + 1, false, count);
                    }
                }
            }
        }
    }

    function outlineOpponentShips() {
        const draw = new Draw(opponent.area);

        for (let x = 0; x < opponent.grid.length; x += 1) {
            for (let y = game.yOffset; y < opponent.grid[x].length; y += 1) {
                const cell = opponent.grid[x][y];
                const ship = opponent.ships[cell.ship.id];

                if (ship && ship.hits < ship.size) {
                    draw.ship(
                        x,
                        y,
                        cell.ship.direction,
                        cell.ship.position,
                        null,
                        true,
                    );
                }
            }
        }
    }

    function clearPlayerMap() {
        if (game.state === State.Positioning) {
            player = ResetPlayer("player");
            player.grid = CreateGrid(player, game.size);
            ResetFleet();
        }
    }

    function opponentAreaClick(event) {
        const draw = new Draw(opponent.area);
        const drawPlayer = new Draw(player.area);

        let x = Math.floor(
            (event.pageX - opponent.area.getBoundingClientRect().left) /
                game.cellSize,
        );
        let y = Math.floor(
            (event.pageY - opponent.area.getBoundingClientRect().top) /
                game.cellSize,
        );

        if (x < 0) {
            x = 0;
        }
        if (y < 0) {
            y = 0;
        }

        if (y >= game.size + game.yOffset) {
            switch (x) {
                case 0:
                case 1:
                    // Fire
                    if (game.state === State.Firing) {
                        // Show player hits.
                        const playerScore = ShowHits(
                            opponent.grid,
                            opponent,
                            true,
                        );

                        // Show opponent hits.
                        const opponentScore = ShowHits(player.grid, player);

                        UpdatePlayerShips(player);
                        UpdatePlayerShips(opponent);

                        let difference = opponent.lastCount - opponent.count;
                        let percent = Math.round(
                            (playerScore.hits / GetTargetCount(opponent.grid)) *
                                100,
                        );

                        draw.status(
                            "Hits: " +
                                playerScore.hits +
                                (percent ? " (" + percent + "%)" : "") +
                                (difference
                                    ? ", Ships destroyed: " + difference
                                    : ""),
                            "Green",
                            opponent.name,
                        );

                        difference = player.lastCount - player.count;
                        percent = Math.round(
                            (opponentScore.hits / GetTargetCount(player.grid)) *
                                100,
                        );

                        if (game.state === State.Over) {
                            drawPlayer.status("Game Over", "Red", player.name);
                        } else {
                            if (!percent) {
                                percent = "0";
                            }
                            drawPlayer.status(
                                "Hits: " +
                                    opponentScore.hits +
                                    " (" +
                                    percent +
                                    "%)" +
                                    (difference
                                        ? ", Ships destroyed: " + difference
                                        : ""),
                                "Red",
                                player.name,
                            );
                        }

                        ShowDestroyedShips(opponent.grid, opponent);

                        game.turn += 1;
                        // Wave complete, check for winner.
                        if (player.count === 0 || opponent.count === 0) {
                            let isGameOver = game.level === 2;
                            let isAdvancing = !isGameOver;
                            let textColor = "Green";
                            let endMessage;
                            switch (0) {
                                case player.count + opponent.count:
                                    // Tie, repeat the wave
                                    endMessage = "Stalemate, Repeat this wave";
                                    isGameOver = false;
                                    isAdvancing = false;
                                    textColor = "Orange";
                                    break;
                                case player.count:
                                    // Game over, player defeated
                                    endMessage = `Defeated on the ${levels[game.level]}`;
                                    game.level = 0;
                                    textColor = "Red";
                                    isGameOver = true;
                                    isAdvancing = false;
                                    break;
                                case opponent.count:
                                default:
                                    // Invaders defeated
                                    endMessage = isGameOver
                                        ? `Victory, ${levels[game.level]} Defeated`
                                        : `${levels[game.level]} Complete`;
                                    game.level += 1;
                                    break;
                            }
                            outlineOpponentShips();
                            draw.text(
                                0,
                                game.cellSize * 1.7,
                                game.size * game.cellSize,
                                endMessage,
                                game.cellSize / 2,
                                true,
                                textColor,
                            );
                            game.state = State.Over;
                            // update primary button
                            draw.button(
                                0,
                                360,
                                game.cellSize * 2,
                                isAdvancing ? "Next" : "End",
                                "Green",
                                isAdvancing ? 12 : 16,
                            );
                        } else {
                            // invaders turn
                            if (game.turn > 1 && game.level > 0) {
                                // Target around hits.
                                CreateCloseTargets(
                                    player.grid,
                                    player,
                                    opponent,
                                );
                            }
                            // Set opponent targets.
                            CreateRandomTargets(opponent, player);
                        }
                        return;
                    }
                    if (
                        game.state > State.Positioning &&
                        game.state < State.Over
                    ) {
                        game.state = State.Targeting;
                        return;
                    }
                    // Quit/Next
                    if (game.state === State.Over) {
                        NewGame();
                        const size = game.cellSize * 2;
                        // update primary button
                        draw.button(0, 360, size, "Fire", "Green", 12);
                        return;
                    }
                    return;
                case 2:
                case 3:
                case 4:
                    // Auto
                    if (
                        game.state === State.Targeting ||
                        game.state === State.Firing
                    ) {
                        draw.message(
                            "All targets selected. Fire when ready.",
                            "Green",
                        );
                        CreateRandomTargets(player, opponent, true);

                        if (game.state === State.Firing) return;

                        game.state = State.Firing;
                        return;
                    }
                    return;
                case 5:
                case 6:
                case 7:
                    // remove targets
                    if (game.state !== State.Firing) return;
                    let count = 0;
                    for (let x = 0; x < opponent.grid.length; x += 1) {
                        for (
                            let y = game.yOffset;
                            y < opponent.grid[x].length;
                            y += 1
                        ) {
                            if (
                                opponent.grid[x][y].target &&
                                opponent.grid[x][y].turn === game.turn
                            ) {
                                opponent.grid[x][y].target = false;
                                opponent.grid[x][y].turn = 0;
                                draw.cell(x, y);
                                count += 1;
                            }
                        }
                    }
                    game.state = State.Targeting;
                    draw.message(`Remaining targets ${count}`, "Green");
                    return;
                case 8:
                case 9:
                default:
                    // Switch Maps
                    document
                        .querySelector("#targetPanel")
                        .classList.add("hidden");
                    document
                        .querySelector("#playerMap")
                        .classList.remove("hidden");
                    return;
            }
        }

        // main grid
        if (y >= game.yOffset) {
            if (
                (game.state === State.Targeting ||
                    game.state === State.Firing) &&
                (!opponent.grid[x][y].turn ||
                    opponent.grid[x][y].turn === game.turn)
            ) {
                let count =
                    player.RemainingTargets(game.level) -
                    GetTargetCount(opponent.grid);

                // Set targets.
                if (
                    opponent.grid[x][y].target ||
                    (!opponent.grid[x][y].target && count)
                ) {
                    SetTarget(opponent, x, y, true, count, true);
                    count =
                        player.RemainingTargets(game.level) -
                        GetTargetCount(opponent.grid);
                }

                if (
                    !GetTargetCount(opponent.grid) &&
                    game.state !== State.Targeting
                ) {
                    game.state = State.Targeting;
                } else {
                    game.state = State.Firing;
                }

                draw.message("Remaining Targets: " + count.toString(), "Green");
            }
        }
    }

    function playerAreaClick(event) {
        const draw = new Draw(player.area);
        const drawOpp = new Draw(opponent.area);

        let x = Math.floor(
            (event.pageX - player.area.getBoundingClientRect().left) /
                game.cellSize,
        );
        let y = Math.floor(
            (event.pageY - player.area.getBoundingClientRect().top) /
                game.cellSize,
        );

        if (x < 0) {
            x = 0;
        }
        if (y < 0) {
            y = 0;
        }

        // bottom buttons
        if (y >= game.size + game.yOffset) {
            switch (x) {
                case 0:
                case 1:
                    // Ready
                    if (
                        game.state > State.Positioning ||
                        (game.state === State.Positioning && player.count > 9)
                    ) {
                        document
                            .querySelector("#playerMap")
                            .classList.add("hidden");
                        document
                            .querySelector("#targetPanel")
                            .classList.remove("hidden");
                        game.state = State.Targeting;
                        // Set opponent targets.
                        CreateRandomTargets(opponent, player);
                        draw.status(
                            "Game started. My Ships.",
                            "Green",
                            player.name,
                        );
                        drawOpp.status(
                            "Select your targets. Available Targets: " +
                                (player.RemainingTargets(game.level) -
                                    GetTargetCount(opponent.grid)),
                            "Green",
                            opponent.name,
                        );
                        draw.buttons("player");
                        return;
                    }
                    // Quit/next
                    if (game.state === State.Over) {
                        NewGame();
                        return;
                    }
                    break;
                case 2:
                case 3:
                case 4:
                    // Auto
                    if (game.state === State.Positioning) {
                        clearPlayerMap();

                        CreateRandomFleet(player, true);
                        ResetFleet();
                        draw.status(
                            "All ships ready. Hit Ready to begin.",
                            "Green",
                            player.name,
                        );
                        return;
                    }
                    break;
                case 5:
                case 6:
                case 7:
                    // Clear ships
                    if (game.state === State.Positioning) {
                        // Clear
                        clearPlayerMap();
                        draw.status(
                            `${levels[game.level]}: Position your ships.`,
                            "Green",
                            player.name,
                        );
                        return;
                    }
                    break;
                default:
                    // Switch Maps
                    document
                        .querySelector("#playerMap")
                        .classList.add("hidden");
                    document
                        .querySelector("#targetPanel")
                        .classList.remove("hidden");
                    return;
            }
            return;
        }

        // main grid
        if (y >= game.yOffset) {
            if (
                game.state === State.Positioning &&
                player.count < 10 &&
                !player.grid[x][y].ship.id
            ) {
                // Set fleet.
                if (!startPos) {
                    startPos = {
                        x: x,
                        y: y,
                    };
                    draw.select(x, y);
                    draw.status(
                        "Click again to set the end of the ship.",
                        "Green",
                        player.name,
                    );
                } else {
                    // Check direction and get size.
                    let size;
                    let direction;
                    switch (true) {
                        case x === startPos.x:
                            if (y < startPos.y) {
                                endPos = startPos;
                                startPos = {
                                    x: x,
                                    y: y,
                                };
                                x = endPos.x;
                                y = endPos.y;
                            } else {
                                endPos = {
                                    x: x,
                                    y: y,
                                };
                            }
                            size = endPos.y - startPos.y + 1;
                            direction = "h";
                            break;
                        case y === startPos.y:
                            if (x < startPos.x) {
                                endPos = startPos;
                                startPos = {
                                    x: x,
                                    y: y,
                                };
                                x = endPos.x;
                                y = endPos.y;
                            } else {
                                endPos = {
                                    x: x,
                                    y: y,
                                };
                            }
                            size = endPos.x - startPos.x + 1;
                            direction = "v";
                            break;
                        default:
                            draw.cell(startPos.x, startPos.y);
                            startPos = {
                                x: x,
                                y: y,
                            };
                            endPos = undefined;
                            draw.select(startPos.x, startPos.y);
                            draw.status(
                                "Invalid selection.",
                                "Red",
                                player.name,
                            );
                    }
                    if (size && HasShip(player, size)) {
                        if (
                            AddShip(
                                player,
                                startPos.x,
                                startPos.y,
                                direction,
                                size,
                                true,
                            )
                        ) {
                            ResetFleet();
                            draw.status(
                                shipTypes[size] + " added.",
                                "Green",
                                player.name,
                            );
                        }
                        startPos = undefined;
                        endPos = undefined;
                    } else {
                        draw.cell(startPos.x, startPos.y);
                        startPos = undefined;
                        endPos = undefined;
                    }
                }
                if (player.count > 9) {
                    draw.status(
                        "All ships ready. Hit Ready to begin.",
                        "Green",
                        player.name,
                    );
                }
            }
        }
    }

    function Load() {
        NewGame(true);
        // draw buttons
        Draw(player.area).buttons(player.name);
        Draw(opponent.area).buttons(opponent.name);
        drawStartButton();
        // Click events.

        opponent.area.addEventListener("click", opponentAreaClick);

        player.area.addEventListener("click", playerAreaClick);

        document
            .querySelector("#startArea")
            .addEventListener("click", function () {
                // hide start
                document.querySelector("#startPage").classList.add("hidden");
                // show map
                document.querySelector("#playerMap").classList.remove("hidden");
            });

        CreateRandomFleet(opponent);
    }

    // Constructor.
    (function () {
        game = {
            state: 0,
            size: 10,
            cellSize: 30,
            turn: 1,
            level: 0,
            yOffset: 2,
            width: 300,
            height: 420,
        };

        shipTypes = [];
        shipTypes[2] = "Orbital Scout";
        shipTypes[3] = "System Enforcer";
        shipTypes[4] = "Galactic Fighter";
        shipTypes[5] = "Interstellar Command";
    })();

    return {
        load: Load,
    };
})();

tacticalStand.load();
