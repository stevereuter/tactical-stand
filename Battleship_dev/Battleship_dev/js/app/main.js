
var main = function () {

    var player, opponent, game, startPos, endPos;

    // Methods

    function DrawCircle(ctx, color, size) {
        return function (row, column) {
            var x, y, width, height;

            // Draw circle.
            x = (row * game.cellSize) + (game.cellSize / 2);
            y = (column * game.cellSize) + (game.cellSize / 2);
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, (game.cellSize / 2) * size, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.fill();
            ctx.closePath();
        };
    }

    function DrawHit(ctx) {
        return function (row, column) {

            // Draw circle.
            DrawCircle(ctx, 'white', 0.4)(row, column);
            DrawCircle(ctx, 'red', 0.3)(row, column);
        };
    }

    function DrawMiss(ctx) {
        return function (row, column) {

            // Draw circle.
            DrawCircle(ctx, 'white', 0.4)(row, column);
            DrawCircle(ctx, 'blue', 0.3)(row, column);
        };
    }

    function DrawText(ctx) {
        return function (x, y, width, text, size) {

            if (!size) {
                size = game.cellSize / 2;
            }
            ctx.beginPath();
            ctx.clearRect(x - 8, y - 24, width + 20, size + 16);
            ctx.closePath();

            ctx.beginPath();
            ctx.fillStyle = 'white';
            ctx.font = size + 'px Arial';
            ctx.fillText(text, x, y, width);
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
        return function (row, column, direction, position) {
            var x, y, width, height;

            // Clear cell first.
            DrawCell(ctx)(row, column);

            x = row * game.cellSize;
            y = column * game.cellSize;
            width = game.cellSize;
            height = game.cellSize;

            ctx.fillStyle = 'grey';

            if (direction ==='h') {
                x += 5;
                width -= 10;

                switch (position) {
                    case 0: // Front.
                        y += 5;
                        break;
                    case 2: // Rear.
                        height -= 5;
                        break;
                }
            } else {
                y += 5;
                height -= 10;

                switch (position) {
                    case 0: // Front.
                        x += 5;
                        break;
                    case 2: // Rear.
                        width -= 5;
                        break;
                }
            }

            ctx.beginPath();
            ctx.fillRect(x, y, width, height);
        };
    }

    function DrawTarget(ctx) {
        return function (row, column) {
            // Draw target on opponents grid.
            var x, y;

            // Clear cell first.
            DrawCell(ctx)(row, column);

            ctx.strokeStyle = 'red';

            // Start at the top middle of the selected cell. Vertical line.
            x = (row * game.cellSize) + (game.cellSize / 2);
            y = (column * game.cellSize) + 4;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + game.cellSize - 8);
            ctx.stroke();
            ctx.closePath();
            // Horizontal line.
            x = (row * game.cellSize) + 4;
            y = (column * game.cellSize) + (game.cellSize / 2);
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + game.cellSize - 8, y);
            ctx.stroke();
            ctx.closePath();
            // Draw circle.
            x = (row * game.cellSize) + (game.cellSize / 2);
            y = (column * game.cellSize) + (game.cellSize / 2);
            ctx.beginPath();
            ctx.arc(x, y, (game.cellSize / 2) - 8, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.closePath();
        };
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
            ship: DrawShip(ctx)
        };
    }

    function GetTargetCount(data) {
        var count, r, c;
        count = 0;

        for (r = 0; r < data.length; r++) {
            for (c = 0; c < data[r].length; c++) {
                if (data[r][c].target && data[r][c].turn === game.turn) {
                    count += 1;
                }
            }
        }

        return count;
    }

    function SetTarget(opponent, row, column, show, count) {
        var draw;

        draw = new Draw(opponent.area);

        if (!opponent.grid[row][column].target && (GetTargetCount(opponent.grid) < count)) {
            if (show) {
                draw.target(row, column);
            }
            opponent.grid[row][column].target = true;
            opponent.grid[row][column].turn = game.turn;
        } else {
            draw.cell(row, column);
            opponent.grid[row][column].target = false;
            opponent.grid[row][column].turn = 0;
        }
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

    function CreateGrid(canvas, rows, columns) {
        var ctx, x, y, data, draw;

        if (!columns) {
            // Create a square grid.
            columns = rows;
        }

        draw = new Draw(canvas);
        data = [];

        for (x = 0; x < rows; x += 1) {
            // row
            data[x] = [];

            for (y = 0; y < columns; y += 1) {
                // column
                draw.cell(x, y);
                data[x][y] = { ship: 0, hit: false, target: false, turn: 0 };
            }
        }

        return data;
    }

    function ResetPlayer(name) {
        return {
            name: name,
            area: $('#' + name + 'Area'),
            ships: [],
            count: 0,
            grid: [],
            available: {
                5: 2,
                4: 2,
                3: 4,
                2: 2
            },
            score: { hits: 0, misses: 0 }
        };
    }

    function ResetFleet() {
        var ship, count;

        count = 0;

        for (ship in player.available) {
            $('#len' + ship).text(player.available[ship]);
            count += player.available[ship];
        }

        $('#remainingShips').text(count);
        $('#fleetPanel').removeClass('hidden');
    }

    function NewGame() {

        $('#tagetPanel').addClass('hidden');
        $('#plrStats').addClass('hidden');

        player = ResetPlayer('player');
        opponent = ResetPlayer('opponent');

        opponent.grid = CreateGrid(opponent.area, game.size);
        player.grid = CreateGrid(player.area, game.size);

        ResetFleet();
        CreateRandomFleet(opponent, false);

        game.state = 0;
        game.turn = 1;

        $('#playerProgress').attr('style', 'width: ' +Math.round(opponent.score.hits / 34 * 100).toString() + '%;');
        $('#opponentProgress').attr('style', 'width: ' +Math.round(player.score.hits / 34 * 100).toString() + '%;');
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
                player.grid[x][y].ship = 0;

            }
        }

        for (i = 0; i < size; i += 1) {

            if (player.grid[x][y].ship) {
                Undo(i - 1);
                return;
            }

            if (show) {
                draw.ship(x, y, direction, (i < 1 ? 0 : (i + 1 === size ? 2 : 1)));
            }
            player.grid[x][y].ship = id;

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

        return { x: x, y: y };
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
            if (player.grid[x][y].ship) {
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

    function CreateRandomTargets(player, opponent, show) {
        var i, count, position;

        count = (player.count - GetTargetCount(opponent.grid));

        for (i = 0; i < count; i += 1) {
            position = GetRandomTargetPosition(opponent.grid);
            SetTarget(opponent, position.x, position.y, show, player.count);
        }
    }

    function ShowHits(grid, player, hideMiss) {
        var x, y, draw, hits, misses;

        draw = new Draw(player.area);
        hits = 0;
        misses = 0;

        // Show player hits.
        for (x in grid) {
            for (y in grid[x]) {
                if (grid[x][y].target && grid[x][y].turn === game.turn) {

                    if (!hideMiss) {
                        draw.cell(x, y);
                    }
                    if (grid[x][y].ship) {
                        // Hit.
                        grid[x][y].hit = true;

                        draw.hit(x, y);
                        player.score.hits += 1;
                        hits += 1;
                    } else {
                        // Miss.
                        if (!hideMiss) {
                            draw.miss(x, y);
                        }
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
                    shipID = player.grid[x][y].ship;
                    player.ships[shipID].hits += 1;
                }
            }
        }

        count = 0;

        for (i in player.ships) {
            if (player.ships[i].size > player.ships[i].hits) {
                count += 1;
            }
        }
        player.count = count;
        return count;
    }

    function Load() {

        NewGame();
        // Click events.

        $('#startOver').click(function (event) {
            NewGame();
        });

        $('#fleetReset').click(function (event) {
            event.preventDefault();

            if (game.state === 0) {

                player = ResetPlayer('player');
                player.grid = CreateGrid(player.area, game.size);
                ResetFleet();
            }
        });

        $('#fleetRandom').click(function (event) {
            event.preventDefault();

            $('#fleetReset').click();

            if (game.state === 0) {

                CreateRandomFleet(player, true);
                ResetFleet();
                $('#fleetDone').prop('disabled', false);
            }
        });

        opponent.area.click(function (event) {
            var x, y;

            x = Math.floor(event.offsetX / game.cellSize);
            y = Math.floor(event.offsetY / game.cellSize);

            if (x < 0) {
                x = 0;
            }
            if (y < 0) {
                y = 0;
            }

            if ((game.state === 1 || game.state === 2) && (!opponent.grid[x][y].turn || opponent.grid[x][y].turn === game.turn)) {
                // Set targets.
                SetTarget(opponent, x, y, true, player.count);

                if (!GetTargetCount(opponent.grid) && game.state !== 1) {
                    game.state = 1;
                } else {
                    game.state = 2;
                }
            }


            $('#oppTargets').text(player.count - GetTargetCount(opponent.grid));

        });

        player.area.click(function (event) {
            var x, y, i, size, hits, id, shipSize, draw, direction;

            draw = new Draw(player.area);

            x = Math.floor(event.offsetX / game.cellSize);
            y = Math.floor(event.offsetY / game.cellSize);

            if (x < 0) {
                x = 0;
            }
            if (y < 0) {
                y = 0;
            }

            if (game.state === 0 && player.count < 10 && !player.grid[x][y].ship) {
                // Set fleet.
                if (!startPos) {
                    startPos = { x: x, y: y };
                    draw.select(x, y);
                } else {
                    // Check direction and get size.
                    switch (true) {
                        case x === startPos.x:
                            if (y < startPos.y) {
                                endPos = startPos;
                                startPos = { x: x, y: y };
                                x = endPos.x;
                                y = endPos.y;
                            } else {
                                endPos = { x: x, y: y };
                            }
                            size = endPos.y - startPos.y + 1;
                            direction = 'h';
                            break;
                        case y === startPos.y:
                            if (x < startPos.x) {
                                endPos = startPos;
                                startPos = { x: x, y: y };
                                x = endPos.x;
                                y = endPos.y;
                            } else {
                                endPos = { x: x, y: y };
                            }
                            size = endPos.x - startPos.x + 1;
                            direction = 'v';
                            break;
                        default:
                            draw.cell(startPos.x, startPos.y);
                            startPos = { x: x, y: y };
                            endPos = undefined;
                            draw.select(startPos.x, startPos.y);
                    }
                    if (size && HasShip(player, size)) {

                        if (AddShip(player, startPos.x, startPos.y, direction, size, true)) {

                            ResetFleet();
                        }
                        startPos = undefined;
                        endPos = undefined;

                    } else {
                        draw.cell(startPos.x, startPos.y);
                        draw.cell(endPos.x, endPos.y);
                        startPos = undefined;
                        endPos = undefined;
                    }
                }
                if (player.count > 9) {
                    $('#fleetDone').prop('disabled', false);
                }
            }

            id = player.grid[x][y].ship;
            if (id) {
                hits = player.ships[id].hits;
                shipSize = player.ships[id].size;
            }

            $('#plrDamage').text(Math.round(hits / shipSize * 100));
            $('#plrID').text(id);

            $('#plrStats').removeClass('hidden');
        });

        $('#fleetDone').click(function (event) {
            event.preventDefault();

            $('#fleetDone').prop('disabled', true);
            $('#fleetPanel').addClass('hidden');
            $('#tagetPanel').removeClass('hidden');
            game.state = 1;
            // Set opponent targets.
            CreateRandomTargets(opponent, player);
        });

        $('#targetRandom').click(function (event) {
            event.preventDefault();

            if (game.state === 1 || game.state === 2) {
                CreateRandomTargets(player, opponent, true);
                $('#oppTargets').text(player.count - GetTargetCount(opponent.grid));

                if (game.state === 1) {
                    game.state = 2;
                }
            }
        });

        $('#fire').click(function (event) {
            if (game.state === 2) {
                var draw, playerScore, opponentScore, ships;

                draw = new Draw(opponent.area);

                // Show player hits.
                playerScore = ShowHits(opponent.grid, opponent);
                // Show opponent hits.
                opponentScore = ShowHits(player.grid, player, true);
                // Update UI scores.
                $('#oppHits').text(playerScore.hits);
                $('#oppMisses').text(playerScore.misses);
                $('#oppAc').text(Math.round(playerScore.hits / player.count * 100));
                $('#oppTotal').text(opponent.score.hits);
                $('#plrTotal').text(player.score.hits);
                $('#plrStats').addClass('hidden');

                ships = UpdatePlayerShips(player);
                UpdatePlayerShips(opponent);

                $('#plrLost').text(10 - ships);
                $('#oppTargets').text(player.count);
                $('#playerProgress').attr('style', 'width: ' + Math.round(opponent.score.hits / 34 * 100).toString() + '%;');
                $('#opponentProgress').attr('style', 'width: ' + Math.round(player.score.hits / 34 * 100).toString() + '%;');

                game.turn += 1;
                // Check for winner.
                if (player.count === 0 || opponent.count === 0) {
                    // Game over.
                    switch (0) {
                        case player.count + opponent.count:
                            // Tie.
                            draw.text(100, 190, 200, 'Game Over - Tie');
                            break;
                        case player.count:
                            draw.text(100, 190, 200, 'Game Over - Computer Wins');
                            break;
                        case opponent.count:
                            draw.text(100, 190, 200, 'Game Over - You Win');
                            break;
                        default:

                    }
                    game.state = 3;
                } else {
                    // Set opponent targets.
                    CreateRandomTargets(opponent, player);
                }
            }
            game.state = 1;
        });

        CreateRandomFleet(opponent, false);

        $('body').on('keyup', function (event) {
            switch (event.which) {
                case 67: // C - Clear fleet.
                    $('#fleetReset').click();
                    break;
                case 80: // P - Auto place fleet.
                    $('#fleetRandom').click();
                    break;
                case 82: // R - Ready, start.
                    $('#fleetDone').click();
                    break;
                case 83: // S - Start over.
                    $('#startOver').click();
                    break;
                case 84: // T - Auto target.
                    $('#targetRandom').click();
                    break;
                case 70: // F - Fire.
                    $('#fire').click();
                    break;
                default:

            }
        });

    }

    // Constructor.
    (function () {

        game = {
            state: 0,
            size: 10,
            cellSize: 40,
            turn: 1
        };
        // States: 0 positioning, 1 targeting, 2 firing, 3 over

    }());
    return {
        load: Load
    };
}();


$(function () {
    main.load();
});