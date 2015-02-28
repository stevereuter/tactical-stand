
var main = function () {

    var player, opponent, game, startPos, endPos;

    // Methods

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
            select: DrawSelect(ctx)
        };
    }

    function GetTargetCount(data) {
        var count, r, c;
        count = 0;

        for (r = 0; r < data.length; r++) {
            for (c = 0; c < data[r].length; c++) {
                if (data[r][c].target) {
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
        } else {
            draw.cell(row, column);
            data[row][column].target = false;
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
                data[x][y] = { ship: 0, hit: false, target: false };
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
                len5: 2,
                len4: 2,
                len3: 4,
                len2: 2
            }
        };
    }

    function ResetFleet() {
        var ship, count;

        count = 0;

        for (ship in player.available) {
            $('#' + ship).text(player.available[ship]);
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
    }

    function HasShip(data, size) {
        var ship;

        for (ship in data.available) {
            if ('len' + size === ship && data.available[ship] > 0) {
                return true;
            }
        }

        return;
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
                            size = y - startPos.y + 1;
                            direction = 'v';
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
                            size = x - startPos.x + 1;
                            endPos = { x: x, y: y };
                            direction = 'h';
                            break;
                        default:
                            draw.cell(startPos.x, startPos.y);
                            startPos = { x: x, y: y };
                            endPos = undefined;
                            draw.select(x, y);
                    }
                    if (endPos && HasShip(player, size)) {

                        player.count += 1;
                        player.ships[player.count] = { size: size, hits: 0 };

                        if (direction === 'h') {
                            for (i = startPos.x; i <= startPos.x + size - 1; i += 1) {
                                if (player.grid[i][y].ship) {
                                    $('#fleetReset').click();
                                    startPos = undefined;
                                    endPos = undefined;
                                    return;
                                }
                                draw.select(i, y);
                                player.grid[i][y].ship = player.count;
                            }
                        } else {
                            for (i = startPos.y; i <= startPos.y + size - 1; i += 1) {
                                if (player.grid[x][i].ship) {
                                    $('#fleetReset').click();
                                    startPos = undefined;
                                    endPos = undefined;
                                    return;
                                }
                                draw.select(x, i);
                                player.grid[x][i].ship = player.count;
                            }
                        }
                        player.available['len' + size] -= 1;
                        ResetFleet();
                        startPos = undefined;
                        endPos = undefined;
                    } else {
                        draw.cell(startPos.x, startPos.y);
                        draw.cell(x, y);
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
        });
    }

    // Constructor.
    (function () {

        game = {
            state: 1,
            size: 10,
            cellSize: 40
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