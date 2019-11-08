
var battleship = function () {

    var player, opponent, game, startPos, endPos, levels, shipTypes;

    // Methods

    //#region Draw Methods. 
    function DrawHit(ctx) {
        return function (row, column) {

            // Draw circle.
            DrawCircle(ctx)(row * game.cellSize, column * game.cellSize, game.cellSize, null, 'Red', null, (game.cellSize / 2) * .4);
        };
    }

    function DrawMiss(ctx) {
        return function (row, column) {

            // Draw circle.
            DrawCircle(ctx)(row * game.cellSize, column * game.cellSize, game.cellSize, null, 'Blue', null, (game.cellSize / 2) * .4);
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
            ctx.fillStyle = (color ? color : 'white');
            ctx.font = size + 'px "8-bit"';
            ctx.fillText(text, x, y, width);
            ctx.closePath();
        };
    }

    function DrawMessage(ctx) {
        return function (text, color) {
            DrawText(ctx)(0, game.cellSize * 1.7, game.size * game.cellSize, text, (game.cellSize / 2), true, color);
        };
    }

    function DrawCell(ctx) {
        return function (row, column) {
            var x, y, width, height;

            x = row * game.cellSize;
            y = column * game.cellSize;
            width = game.cellSize;
            height = game.cellSize;
            ctx.strokeStyle = 'grey';

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
            gradient = ctx.createRadialGradient(x + (size / 2) - 10, y + (size / 2) - 5, 0, x + (size / 2) - 5, y + (size / 2) - 5, radius + 7.5);
            gradient.addColorStop(0, 'white');
            gradient.addColorStop(1, color);
            ctx.beginPath();
            ctx.fillStyle = gradient;
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = (radius > 20 ? radius * .18 : 4);
            ctx.arc(x + (size / 2), y + (size / 2), radius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();
            ctx.closePath();
            if (text) {

                DrawText(ctx)(x + offset, y + 35, size, text, 15, false, 'black');
            }
            ctx.restore();
        };
    }

    function drawButtons(ctx) {
        return function (name) {
            var x, y, size, level, offset, gradient, color, text;

            x = 0;
            y = 360;
            size = game.cellSize * 2;

            for (x = 0; x < game.width; x += size) {


                text = '';

                switch (x) {
                    case 0:
                        color = 'Green';
                        text = (name === 'opponent' ? 'Fire' : 'Ready');
                        offset = (name === 'opponent' ? (game.cellSize / 2) : 7.5);
                        break;
                    case 60:
                        color = 'Orange';
                        text = (name === 'player' && game.state > 0 ? '' : 'Auto');
                        offset = 12.5;
                        break;
                    case 120:
                        color = 'Red';
                        text = (game.state === 0 && name === 'player' ? 'Clear' : 'Quit');
                        offset = (game.state === 0 && name === 'player' ? 10 : (game.cellSize / 2));
                        break;
                    case 180:
                        if (name === 'player') {

                            color = 'DarkSlateGray';
                            text = levels[game.level];
                            switch (game.level) {
                                case 0:
                                    offset = 12.5;
                                    break;
                                case 1:
                                    offset = 5;
                                    break;
                                case 2:
                                    offset = 12.5;
                                    break;
                                case 3:
                                    offset = 2.5;
                                    break;
                                default:
                                    offset = (game.cellSize / 2);
                            }
                        }

                        break;
                    default:

                        color = '#003300';
                        text = 'Switch';
                        offset = 7.5;
                        break;
                }

                if (text) {

                    DrawCircle(ctx)(x, y, size, text, color, offset);
                } else {
                    ctx.clearRect(x * game.cellSize, y * game.cellSize, size, size);
                }
            }

        };
    }

    function drawStartButton() {

        var ctx = $('#startArea')[0].getContext('2d');
       
        DrawCircle(ctx)(125, 100, 50, undefined, 'green', 0, 50);
        DrawText(ctx)(105, 140, 90, 'BEGIN', 45, false, '#272b30');
    }

    function drawPlayerStatus(ctx) {
        return function (text, color, name) {
            var x, data;

            if (name === 'player') {
                data = player;
            } else {
                data = opponent;
            }

            // Draw status bars.
            ctx.save();
            ctx.beginPath();
            ctx.clearRect(0, 0, (game.width / 2), game.cellSize);
            ctx.fillStyle = 'Green';
            ctx.fillRect(0, 2.5, -(game.cellSize / 2) * opponent.count + (game.width / 2), 10);
            ctx.fillStyle = 'Red';
            ctx.fillRect(0, 17.5, -(game.cellSize / 2) * player.count + (game.width / 2), 10);
            ctx.closePath();
            ctx.restore();

            // Draw ship counts.
            // clear
            ctx.clearRect((game.width / 2), 0, game.width, game.cellSize);
            for (x = 5; x < 10; x += 1) {

                // draw ship part
                DrawShip(ctx)(x, 0, 'v', (x === 5 ? 0 : -1), false, true);
                if (x > 5 && x < 9) {
                    // draw top line
                    ctx.beginPath();
                    ctx.moveTo(x * game.cellSize, game.cellSize * .125);
                    ctx.lineTo(x * game.cellSize + game.cellSize, game.cellSize * .125);
                    ctx.stroke();
                    ctx.closePath();
                    // draw bottom line
                    ctx.beginPath();
                    ctx.moveTo(x * game.cellSize, game.cellSize - (game.cellSize * .125));
                    ctx.lineTo(x * game.cellSize + game.cellSize, game.cellSize - (game.cellSize * .125));
                    ctx.stroke();
                    ctx.closePath();
                }

                // draw ship counts
                if (x > 5) {
                    if (game.state === 0 && name === 'player') {

                        DrawText(ctx)((x * game.cellSize) + 2, game.cellSize * .7, game.cellSize, data.available[x - 4]);
                    } else {

                        DrawText(ctx)((x * game.cellSize) + 2, game.cellSize * .7, game.cellSize, data.remaining[x - 4]);
                    }
                }
            }

            // Write message.
            if (text) {
                if (!color) {

                    color = 'White';
                }
                DrawMessage(ctx)(text, color);
            }
        };
    }

    function DrawSelect(ctx) {
        return function (row, column) {
            var x, y, width, height;

            // Clear cell first.
            DrawCell(ctx)(row, column);

            x = row * game.cellSize + 5;
            y = column * game.cellSize + 5;
            width = game.cellSize - 10;
            height = game.cellSize - 10;
            ctx.fillStyle = 'grey';

            ctx.beginPath();
            ctx.fillRect(x, y, width, height);
        };
    }

    function DrawShip(ctx) {
        return function (row, column, direction, position, fill, noBorder) {
            var x, y, width, height;

            // Clear cell first.
            if (!noBorder) {

                DrawCell(ctx)(row, column);
            }

            x = row * game.cellSize;
            y = column * game.cellSize;
            width = game.cellSize;
            height = game.cellSize;

            ctx.save();
            ctx.fillStyle = 'grey';
            ctx.lineStyle = 'grey';

            // Draw from center.
            ctx.translate(x + (game.cellSize / 2), y + (game.cellSize / 2));

            if (direction === 'v') {
                // Rotate.
                ctx.rotate(-.5 * Math.PI);
            }

            ctx.beginPath();

            switch (position) {
                case 0:
                    // Front.
                    ctx.moveTo(game.cellSize * -.375, game.cellSize * .5);
                    ctx.quadraticCurveTo(game.cellSize * -.375, game.cellSize * -.125, 0, game.cellSize * -.375);
                    ctx.stroke();
                    ctx.quadraticCurveTo(game.cellSize * .375, game.cellSize * -.125, game.cellSize * .375, game.cellSize * .5);
                    ctx.stroke();
                    ctx.closePath();
                    break;
                case -1:
                    // Rear.
                    ctx.moveTo(game.cellSize * -.375, game.cellSize * -.5);
                    ctx.bezierCurveTo(game.cellSize * -.375, game.cellSize * .5, game.cellSize * .375, game.cellSize * .5, game.cellSize * .375, game.cellSize * -.5);
                    ctx.stroke();
                    ctx.closePath();
                    break
                default:

                    if (fill) {
                        ctx.fillRect(game.cellSize * -.375, game.cellSize * -.5, game.cellSize * .75, game.cellSize);
                    } else {
                        ctx.strokeRect(game.cellSize * -.375, game.cellSize * -.5, game.cellSize * .75, game.cellSize);
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
            var x, y;

            // Clear cell first.
            DrawCell(ctx)(row, column);
            ctx.lineWidth = 2;
            ctx.strokeStyle = 'red';

            // Start at the top middle of the selected cell. Vertical line.
            x = (row * game.cellSize) + (game.cellSize / 2);
            y = (column * game.cellSize) + 2;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + game.cellSize - 4);
            ctx.stroke();
            ctx.closePath();
            // Horizontal line.
            x = (row * game.cellSize) + 2;
            y = (column * game.cellSize) + (game.cellSize / 2);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + game.cellSize - 4, y);
            ctx.stroke();
            ctx.closePath();
            // Draw circle.
            x = (row * game.cellSize) + (game.cellSize / 2);
            y = (column * game.cellSize) + (game.cellSize / 2);
            ctx.beginPath();
            ctx.arc(x, y, (game.cellSize / 2) - 4, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.closePath();

            ctx.lineWidth = 1;
        };
    }

    function drawGrid(ctx) {
        return function (data, name) {
            var x, y, cell, draw;

            for (x = 0; x < data.length; x += 1) {
                // column
                for (y = game.yOffset; y < data[x].length; y += 1) {
                    // row
                    cell = data[x][y];

                    DrawCell(ctx)(x, y);
                    if (name === 'player' && cell.shipID) {
                        DrawShip(ctx)(x, y, cell.ship.direction, cell.ship.position);
                    }
                    if (name === 'player' && cell.target && cell.turn === game.turn) {
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


            drawPlayerStatus(ctx)('Place your ships.', 'Green', name);
        }
    }

    function Draw(canvas) {
        var ctx;

        ctx = canvas[0].getContext('2d');

        return {
            cell: DrawCell(ctx),
            target: DrawTarget(ctx),
            select: DrawSelect(ctx),
            hit: DrawHit(ctx),
            miss: DrawMiss(ctx),
            text: DrawText(ctx),
            ship: DrawShip(ctx),
            button: DrawCircle,
            buttons: drawButtons(ctx),
            grid: drawGrid(ctx),
            status: drawPlayerStatus(ctx),
            message: DrawMessage(ctx)
        };
    }

    //#endregion

    function saveLevelToCookie() {
        var expires, today;

        today = new Date();
        expires = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());

        document.cookie = 'battleshipLevel=' + game.level + '; expires=' + expires.toUTCString();
    }

    function getLevelFromCookie() {
        var cookies, cookie, c, regex;

        cookies = document.cookie.split(';');
        regex = /battleshipLevel/;
        for (c in cookies) {
            cookie = cookies[c].split('=');
            if (regex.test(cookie[0])) {
                return parseInt(cookie[1], 10);
            }
        }

        saveLevelToCookie();

        return game.level;
    }

    function GetTargetCount(data) {
        var count, r, c;
        count = 0;

        for (r = 0; r < data.length; r++) {
            for (c = game.yOffset; c < data[r].length; c++) {
                if (data[r][c].target && data[r][c].turn === game.turn) {
                    count += 1;
                }
            }
        }

        return count;
    }

    function SetTarget(opponent, row, column, show, count, setOnly) {
        var draw;

        draw = new Draw(opponent.area);

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

    function GetData(type) {
        return function (row, column) {
            var data;

            if (!type) {
                return;
            }

            switch (type) {
                case 'player':
                    data = player.grid;
                    break;
                case 'opponent':
                    data = opponent.grid;
                    break;
                default:
                    return;
            }

            if (row >= 0) {
                if (!column) {
                    // Grid number passed instead of row column.
                    column = row % game.size;
                    row = Math.floor(row / game.size);
                }

                return data[row][column];
            } else {
                return data;
            }
        };
    }

    function CreateGrid(player, rows, columns) {
        var x, y, data, draw;

        if (!columns) {
            // Create a square grid.
            columns = rows;
        }

        draw = new Draw(player.area);
        data = [];

        for (x = 0; x < rows; x += 1) {
            // row
            data[x] = [];

            for (y = game.yOffset; y < columns + game.yOffset; y += 1) {
                // column
                data[x][y] = { ship: { id: 0, direction: '', position: 0 }, hit: false, target: false, turn: 0 };
            }
        }

        draw.grid(data, player.name);

        return data;
    }

    function ResetPlayer(name) {
        return {
            name: name,
            area: $('#' + name + 'Area'),
            ships: [],
            count: 0,
            lastCount: 0,
            grid: [],
            available: {
                5: 2,
                4: 2,
                3: 4,
                2: 2
            },
            remaining: {
                5: 2,
                4: 2,
                3: 4,
                2: 2
            },
            score: { hits: 0, misses: 0 },
            RemainingTargets: function (level) {
                var count;
                switch (level) {
                    case 3:
                        count = Math.round(this.count * .8);
                        break;
                    case 2:
                        count = Math.round(this.count * .51);
                        break;
                    default:
                        count = this.count;
                }

                return count;
            }
        };
    }

    function ResetFleet() {
        var ship, count;

        count = 0;

        for (ship in player.available) {
            count += player.available[ship];
        }
    }

    function NewGame(background) {

        $('#tagetPanel').addClass('hidden');
        if (!background) {

            $('#playerMap').removeClass('hidden');
        }

        game.state = 0;
        game.turn = 1;

        player = ResetPlayer('player');
        opponent = ResetPlayer('opponent');

        opponent.grid = CreateGrid(opponent, game.size);
        player.grid = CreateGrid(player, game.size);

        ResetFleet();
        CreateRandomFleet(opponent, false);
    }

    function HasShip(data, size) {
        var ship;

        for (ship in data.available) {
            if (size.toString() === ship && data.available[ship] > 0) {
                return true;
            }
        }

        return;
    }

    function AddShip(player, x, y, direction, size, show) {
        var i, draw, id;

        draw = new Draw(player.area);
        id = player.count + 1;


        function Undo(count) {
            var i;

            for (i = count; i >= 0; i -= 1) {

                if (direction === 'h') {
                    x -= 1;
                } else {
                    y -= 1;
                }

                draw.cell(x, y);
                player.grid[x][y].ship = { id: 0, direction: direction, position: (i === 0 ? 0 : (i + 1 === size ? -1 : i)) };

            }
        }

        for (i = 0; i < size; i += 1) {

            if (player.grid[x][y].ship.id) {
                Undo(i - 1);
                return;
            }

            if (show) {
                draw.ship(x, y, direction, (i < 1 ? 0 : (i + 1 === size ? -1 : 1)), true);
            }
            player.grid[x][y].ship = { id: id, direction: direction, position: (i === 0 ? 0 : (i + 1 === size ? -1 : i)) };;

            if (direction === 'h') {
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
        return Math.floor((Math.random() * gridSize));
    }

    function GetPositionFromIndex(index) {
        var x, y;

        y = index % 10;
        x = Math.floor(index / 10);

        return { x: x, y: y + game.yOffset };
    }

    function GetRandomPosition(player, size) {
        var position, i, x, y;

        position = GetPositionFromIndex(CreateRandomIndex(game.size * game.size));
        position.direction = (Math.floor((Math.random() * 2)) ? 'h' : 'v');

        if (position.direction === 'h') {
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

        for (i = 0; i < size; i++) {
            if (player.grid[x][y].ship.id) {
                // Occupied.
                return GetRandomPosition(player, size);
            }
            if (position.direction === 'h') {
                y += 1;
            } else {
                x += 1;
            }
        }

        return position
    }

    function CreateRandomFleet(player, show) {
        var position, a, i, count;

        for (a in player.available) {
            count = player.available[a];
            for (i = 0; i < count; i += 1) {

                position = GetRandomPosition(player, parseInt(a, 10));
                AddShip(player, position.x, position.y, position.direction, parseInt(a, 10), show);
            }
        }
    }

    function GetRandomTargetPosition(grid) {
        var position;

        position = GetPositionFromIndex(CreateRandomIndex(game.size * game.size));

        if (grid[position.x][position.y].target) {
            return GetRandomTargetPosition(grid);
        } else {
            return position;
        }
    }

    function GetFreeCellCount(grid, playerCount) {
        var x, y, cell, count;

        count = 0;

        for (x in grid) {
            for (y in grid[x]) {
                cell = grid[x][y];

                if (!cell.target) {
                    count += 1;
                    if (count >= playerCount) {
                        return playerCount
                    }
                }
            }
        }

        return count;
    }

    function CreateRandomTargets(player, opponent, show) {
        var i, count, position, freeCells;

        if (player.name === 'opponent' && game.level > 2) {
            count = GetFreeCellCount(opponent.grid, (player.RemainingTargets(1) - GetTargetCount(opponent.grid)));
        } else {
            count = GetFreeCellCount(opponent.grid, (player.RemainingTargets(game.level) - GetTargetCount(opponent.grid)));
        }

        for (i = 0; i < count; i += 1) {
            position = GetRandomTargetPosition(opponent.grid);
            SetTarget(opponent, position.x, position.y, show, player.count);
        }
    }

    function ShowHits(grid, player, clear) {
        var x, y, draw, hits, misses;

        draw = new Draw(player.area);
        hits = 0;
        misses = 0;

        // Show player hits.
        for (x in grid) {
            for (y in grid[x]) {
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
        var x, y, shipID, i, count;

        for (x in player.grid) {
            for (y in player.grid[x]) {
                if (player.grid[x][y].hit && player.grid[x][y].turn === game.turn) {
                    shipID = player.grid[x][y].ship.id;
                    player.ships[shipID].hits += 1;
                }
            }
        }

        count = 0;

        player.lastCount = player.count;

        player.remaining = {
            5: 0,
            4: 0,
            3: 0,
            2: 0
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
        var x, y, cell, ship, draw;

        draw = new Draw(player.area);

        for (x = 0; x < grid.length; x += 1) {
            for (y = game.yOffset; y < grid[x].length; y += 1) {

                cell = grid[x][y];
                ship = player.ships[cell.ship.id];
                if (ship && ship.hits === ship.size) {
                    draw.ship(x, y, cell.ship.direction, cell.ship.position, true);
                    draw.hit(x, y);
                }
            }
        }
    }

    function CreateCloseTargets(grid, oppenent, player) {
        var x, y, cell, ship, count;

        if (player.name === 'opponent' && game.level > 2) {
            count = GetFreeCellCount(opponent.grid, 10);
        } else {
            count = GetFreeCellCount(opponent.grid, player.count);
        }

        for (x = 0; x < grid.length; x += 1) {
            for (y = game.yOffset; y < grid[x].length; y += 1) {
                cell = grid[x][y];
                ship = oppenent.ships[cell.ship.id];
                if (cell.hit && ship.hits < ship.size) {
                    if (x > 0) {
                        // Target before.
                        count = SetTarget(oppenent, x - 1, y, false, count);
                    }
                    if (y > game.yOffset && count) {
                        // Target above.
                        count = SetTarget(oppenent, x, y - 1, false, count);
                    }
                    if (x < 9 && count) {
                        // Target after.
                        count = SetTarget(oppenent, x + 1, y, false, count);
                    }
                    if (y < 9 + game.yOffset && count) {
                        // Target below.
                        count = SetTarget(oppenent, x, y + 1, false, count);
                    }
                }
            }
        }
    }

    function GetStats() {
        var x, y, plr, opp, plrHits, oppHits, plrShots, oppShots;
        var s, pShip, oShip, plrLost, oppLost, plrRem, oppRem, plrNotHit, oppNotHit;

        plrShots = 0;
        oppShots = 0;
        plrHits = 0;
        oppHits = 0;
        plrLost = 0;
        oppLost = 0;
        plrRem = 0;
        oppRem = 0;
        plrNotHit = 0;
        oppNotHit = 0;

        for (x = 0; x < opponent.grid.length; x += 1) {
            for (y = game.yOffset; y < opponent.grid.length + game.yOffset; y += 1) {
                plr = player.grid[x][y];
                opp = opponent.grid[x][y];

                if (plr.target) {
                    plrShots += 1;
                    if (plr.hit) {
                        plrHits += 1;
                    }
                }
                if (opp.target) {
                    oppShots += 1;
                    if (opp.hit) {
                        oppHits += 1;
                    }
                }
            }
        }

        // Loop through ships.
        for (s = 1; s < opponent.ships.length; s += 1) {
            pShip = player.ships[s];

            if (pShip.hits === pShip.size) {
                plrLost += 1;
            } else {
                plrRem += 1;
            }
            if (pShip.hits === 0) {
                plrNotHit += 1;
            }

            oShip = opponent.ships[s];

            if (oShip.hits === oShip.size) {
                oppLost += 1;
            } else {
                oppRem += 1;
            }
            if (oShip.hits === 0) {
                oppNotHit += 1;
            }
        }

        return {
            player: {
                hits: plrHits,
                shots: plrShots,
                lost: plrLost,
                remaining: plrRem,
                notHit: plrNotHit
            },
            opponent: {
                hits: oppHits,
                shots: oppShots,
                lost: oppLost,
                remaining: oppRem,
                notHit: oppNotHit
            }
        }
    }

    function outlineOpponentShips() {
        var draw, x, y, ship, cell;

        draw = new Draw(opponent.area);

        for (x = 0; x < opponent.grid.length; x += 1) {
            for (y = game.yOffset; y < opponent.grid[x].length; y += 1) {
                cell = opponent.grid[x][y];
                ship = opponent.ships[cell.ship.id];

                if (ship && ship.hits < ship.size) {
                    draw.ship(x, y, cell.ship.direction, cell.ship.position, null, true);
                }
            }
        }
    }

    function ShowStats(winner) {
        var stats;

        stats = GetStats();

        outlineOpponentShips();
    }

    function clearPlayerMap() {
        if (game.state === 0) {

            player = ResetPlayer('player');
            player.grid = CreateGrid(player, game.size);
            ResetFleet();
        }
    }

    function oppenentAreaClick(event) {
        var x, y, count, button, draw, drawPlayer, playerScore, opponentScore, ships, difference, percent;

        draw = new Draw(opponent.area);
        drawPlayer = new Draw(player.area);

        x = Math.floor((event.pageX - opponent.area.offset().left) / game.cellSize);
        y = Math.floor((event.pageY - opponent.area.offset().top) / game.cellSize);

        if (x < 0) {
            x = 0;
        }
        if (y < 0) {
            y = 0;
        }

        if (y >= game.size + game.yOffset) {
            x = Math.floor(x / 2);
            y = Math.floor((y - 10) / 2);

            button = y.toString() + x.toString();

            switch (button) {
                case '10':
                    // Fire
                    if (game.state === 2) {

                        // Show player hits.
                        playerScore = ShowHits(opponent.grid, opponent, true);

                        // Show opponent hits.
                        opponentScore = ShowHits(player.grid, player);

                        ships = UpdatePlayerShips(player);
                        UpdatePlayerShips(opponent);

                        difference = opponent.lastCount - opponent.count;
                        percent = Math.round((playerScore.hits / GetTargetCount(opponent.grid)) * 100);

                        draw.status('Hits: ' + playerScore.hits + (percent ? ' (' + percent + '%)' : '') + (difference ? ', Ships destroyed: ' + difference : ''), 'Green', opponent.name);

                        difference = player.lastCount - player.count;
                        percent = Math.round((opponentScore.hits / GetTargetCount(player.grid)) * 100);

                        if (game.state === 3) {

                            drawPlayer.status('Game Over', 'Red', player.name);
                        } else {

                            if (!percent) {
                                percent = '0';
                            }
                            drawPlayer.status('Hits: ' + opponentScore.hits + ' (' + percent + '%)' + (difference ? ', Ships destroyed: ' + difference : ''), 'Red', player.name);
                        }

                        ShowDestroyedShips(opponent.grid, opponent);

                        game.turn += 1;
                        // Check for winner.
                        if (player.count === 0 || opponent.count === 0) {
                            // Game over.
                            switch (0) {
                                case player.count + opponent.count:
                                    // Tie.
                                    draw.text(0, game.cellSize * 1.7, game.size * game.cellSize, 'Game Over - Tie', (game.cellSize / 2), true, 'Orange');
                                    ShowStats('Tie');
                                    break;
                                case player.count:
                                    draw.text(0, game.cellSize * 1.7, game.size * game.cellSize, 'Game Over - Computer Wins', (game.cellSize / 2), true, 'Red');
                                    ShowStats('Computer');
                                    break;
                                case opponent.count:
                                    draw.text(0, game.cellSize * 1.7, game.size * game.cellSize, 'Game Over - You Win', (game.cellSize / 2), true, 'Green');
                                    ShowStats('You');
                                    break;
                                default:

                            }
                            game.state = 3;
                        } else {
                            if (game.turn > 1 && game.level > 0) {
                                // Target around hits.
                                CreateCloseTargets(player.grid, player, opponent);
                            }
                            // Set opponent targets.
                            CreateRandomTargets(opponent, player);
                        }
                    }
                    if (game.state > 0 && game.state < 3) {

                        game.state = 1;
                    }
                    break;
                case '11':
                    // Auto
                    if (game.state === 1 || game.state === 2) {

                        draw.message('All targets selected. Fire when ready.', 'Green');
                        CreateRandomTargets(player, opponent, true);

                        if (game.state === 1) {
                            game.state = 2;
                        }
                    }
                    break;
                case '12':
                    // Quit
                    NewGame();
                    break;
                case '13':
                    // No button
                    break;
                case '14':
                    // Switch Maps
                    //var target = document.getElementById('targetPanel');
                    //target.className = target.className + ' hidden';
                    $('#tagetPanel').addClass('hidden');
                    //var player = document.getElementById('playerMap');
                    //player.className = player.className.replace('hidden', '');
                    $('#playerMap').removeClass('hidden');
                    break;
                default:

            }
        } else if (y >= game.yOffset) {

            if ((game.state === 1 || game.state === 2) && (!opponent.grid[x][y].turn || opponent.grid[x][y].turn === game.turn)) {

                count = player.RemainingTargets(game.level) - GetTargetCount(opponent.grid);

                // Set targets.
                if (opponent.grid[x][y].target || (!opponent.grid[x][y].target && count)) {
                    SetTarget(opponent, x, y, true, count, true);
                    count = player.RemainingTargets(game.level) - GetTargetCount(opponent.grid);
                }

                if (!GetTargetCount(opponent.grid) && game.state !== 1) {
                    game.state = 1;
                } else {
                    game.state = 2;
                }

                draw.message('Remaining Targets: ' + count.toString(), 'Green');
            }
        }

    }

    function playerAreaClick(event) {
        var x, y, i, size, hits, id, shipSize, draw, drawOpp, direction, button;

        draw = new Draw(player.area);
        drawOpp = new Draw(opponent.area);

        x = Math.floor((event.pageX - player.area.offset().left) / game.cellSize);
        y = Math.floor((event.pageY - player.area.offset().top) / game.cellSize);

        if (x < 0) {
            x = 0;
        }
        if (y < 0) {
            y = 0;
        }

        if (y >= game.size + game.yOffset) {
            x = Math.floor(x / 2);
            y = Math.floor((y - 10) / 2);

            button = y.toString() + x.toString();

            switch (button) {
                case '10':
                    // Ready
                    if (game.state > 0 || (game.state === 0 && player.count > 9)) {

                        $('#playerMap').addClass('hidden');
                        $('#tagetPanel').removeClass('hidden');
                        game.state = 1;
                        // Set opponent targets.
                        CreateRandomTargets(opponent, player);
                        draw.status('Game started. My Ships.', 'Green', player.name);
                        drawOpp.status('Select your targets. Available Targets: ' + (player.RemainingTargets(game.level) - GetTargetCount(opponent.grid)), 'Green', opponent.name);
                        draw.buttons('player');
                    }
                    break;
                case '11':
                    // Auto
                    if (game.state === 0) {

                        clearPlayerMap();

                        CreateRandomFleet(player, true);
                        ResetFleet();
                        draw.status('All ships placed. Hit Ready to continue.', 'Green', player.name);
                    }
                    break;
                case '12':

                    if (game.state === 0) {
                        // Clear
                        clearPlayerMap();
                        draw.status('Place your ships.', 'Green', player.name);
                    } else {
                        // Quit
                        NewGame();
                    }
                    break;
                case '13':
                    //Level
                    if (game.state < 1) {

                        if (levels[game.level + 1]) {

                            game.level += 1;
                        } else {
                            game.level = 0;
                        }
                        saveLevelToCookie();
                        draw.buttons('player');
                        draw.status('Level changed to ' + levels[game.level], 'White', player.name);
                    }
                    break;
                case '14':
                    // Switch Maps
                    $('#playerMap').addClass('hidden');
                    $('#tagetPanel').removeClass('hidden');
                    break;
                default:

            }
        } else if (y >= game.yOffset) {

            if (game.state === 0 && player.count < 10 && !player.grid[x][y].ship.id) {
                // Set fleet.
                if (!startPos) {
                    startPos = {
                        x: x, y: y
                    };
                    draw.select(x, y);
                    draw.status('Click again to set the end of the ship.', 'Green', player.name);
                } else {
                    // Check direction and get size.
                    switch (true) {
                        case x === startPos.x:
                            if (y < startPos.y) {
                                endPos = startPos;
                                startPos = {
                                    x: x, y: y
                                };
                                x = endPos.x;
                                y = endPos.y;
                            } else {
                                endPos = {
                                    x: x, y: y
                                };
                            }
                            size = endPos.y - startPos.y + 1;
                            direction = 'h';
                            break;
                        case y === startPos.y:
                            if (x < startPos.x) {
                                endPos = startPos;
                                startPos = {
                                    x: x, y: y
                                };
                                x = endPos.x;
                                y = endPos.y;
                            } else {
                                endPos = {
                                    x: x, y: y
                                };
                            }
                            size = endPos.x - startPos.x + 1;
                            direction = 'v';
                            break;
                        default:
                            draw.cell(startPos.x, startPos.y);
                            startPos = {
                                x: x, y: y
                            };
                            endPos = undefined;
                            draw.select(startPos.x, startPos.y);
                            draw.status('Invalid selection.', 'Red', player.name);
                    }
                    if (size && HasShip(player, size)) {

                        if (AddShip(player, startPos.x, startPos.y, direction, size, true)) {

                            ResetFleet();
                            draw.status(shipTypes[size] + ' added.', 'Green', player.name);
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
                    draw.status('All ships placed. Hit Ready to continue.', 'Green', player.name);
                }
            }

            id = player.grid[x][y].ship.id;
            if (id) {
                hits = player.ships[id].hits;
                shipSize = player.ships[id].size;
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

        opponent.area.click(oppenentAreaClick);

        player.area.click(playerAreaClick);

        $('#startArea').click(function (event) {

            // hide start
            $('#startPage').addClass('hidden');
            // show map
            $('#playerMap').removeClass('hidden');
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
            height: 420
        };

        game.level = getLevelFromCookie();

        levels = {
            0: 'Easy',
            1: 'Normal',
            2: 'Hard',
            3: 'Extreme'
        };

        shipTypes = [];
        shipTypes[2] = 'Patrol boat';
        shipTypes[3] = 'Destroyer';
        shipTypes[4] = 'Battleship';
        shipTypes[5] = 'Aircraft carrier';
        // States: 0 positioning, 1 targeting, 2 firing, 3 over

    }());

    return {
        load: Load
    };
}();

battleship.load();