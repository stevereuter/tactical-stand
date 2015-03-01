
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
            var x, y, width, height;

            // Draw circle.
            DrawCircle(ctx, 'white', 0.8)(row, column);
            DrawCircle(ctx, 'red', 0.7)(row, column);
        };
    }

    function DrawMiss(ctx) {
        return function (row, column) {
            var x, y, width, height;

            // Draw circle.
            DrawCircle(ctx, 'white', 0.8)(row, column);
            DrawCircle(ctx, 'blue', 0.7)(row, column);
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

            x = row * game.cellSize;
            y = column * game.cellSize;
            width = game.cellSize;
            height = game.cellSize;
            ctx.fillStyle = 'grey';

            ctx.beginPath();
            ctx.clearRect(x, y, width, height);
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
            miss: DrawMiss(ctx)
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

    function SetTarget(data, row, column, available) {
        var draw, count;

        draw = new Draw(opponent.area);
        count = GetTargetCount(opponent.grid);

        if (!data[row][column].target && count < available) {
            draw.target(row, column);
            data[row][column].target = true;
            data[row][column].turn = game.turn;
        } else {
            draw.cell(row, column);
            data[row][column].target = false;
            data[row][column].turn = 0;
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
            }
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

        player = ResetPlayer('player');
        opponent = ResetPlayer('opponent');

        opponent.grid = CreateGrid(opponent.area, game.size);
        player.grid = CreateGrid(player.area, game.size);

        ResetFleet();

        game.state = 0;
        game.turn = 1;
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
                draw.select(x, y);
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

    function GetPositionFromIndex(index) {
        var x, y;

        y = index % 10;
        x = Math.floor(index / 10);

        return { x: x, y: y };
    }

    function GetRandomPosition(player, size) {
        var position, i, x, y;

        position = GetPositionFromIndex(Math.floor((Math.random() * 100)));
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

    function Load() {

        NewGame();
        // Click events.

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
            var x, y, d;

            x = Math.floor(event.offsetX / game.cellSize);
            y = Math.floor(event.offsetY / game.cellSize);

            if (game.state === 1) {
                // Set targets.
                SetTarget(opponent.grid, x, y, player.count);
            }

            d = GetData('opponent')(x, y);
            $('#oppX').text(x);
            $('#oppY').text(y);
            $('#oppD').text('Target: ' + d.target);

        });

        player.area.click(function (event) {
            var x, y, i, size, draw, direction;

            draw = new Draw(player.area);

            x = Math.floor(event.offsetX / game.cellSize);
            y = Math.floor(event.offsetY / game.cellSize);

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

                        if (AddShip(player, startPos.x, startPos.y, direction, size)) {

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

            $('#plrX').text(x);
            $('#plrY').text(y);
            $('#plrD').text(player.grid[x][y].ship);
        });

        $('#fleetDone').click(function (event) {
            event.preventDefault();

            $('#fleetDone').prop('disabled', true);
            $('#fleetPanel').addClass('hidden');
            $('#tagetPanel').removeClass('hidden');
            game.state = 1;
            // Set opponent targets.

        });

        $('#fire').click(function (event) {
            if (game.state === 1) {
                var oppX, oppY, plrX, plrY, draw;

                draw = new Draw(opponent.area);

                // Show player hits.
                for (oppX in opponent.grid) {
                    for (oppY in opponent.grid[oppX]) {
                        if (opponent.grid[oppX][oppY].target) {
                            if (opponent.grid[oppX][oppY].ship) {
                                // Hit.
                                opponent.grid[oppX][oppY].hit = true;

                                opponent.ships[opponent.grid[oppX][oppY].ship].hits += 1;
                                draw.hit(oppX, oppY);
                            } else {
                                // Miss.
                                draw.miss(oppX, oppY);
                            }
                            opponent.grid[oppX][oppY].turn = game.turn;
                        }
                    }
                }
                // Show opponent hits.

                // Check for winner.
                if (false) {
                    // Game over.
                    game.state = 2;
                }
                game.turn += 1;
            }
        });

        CreateRandomFleet(opponent, false);

    }

    // Constructor.
    (function () {

        game = {
            state: 1,
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