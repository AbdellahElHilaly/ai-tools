import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';

void main() => runApp(const MeteorDodgeApp());

class MeteorDodgeApp extends StatelessWidget {
  const MeteorDodgeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Meteor Dodge',
      theme: ThemeData.dark(useMaterial3: true),
      home: const GamePage(),
    );
  }
}

class Meteor {
  Meteor({required this.x, required this.y, required this.radius, required this.speed});
  double x;
  double y;
  final double radius;
  final double speed;
}

class Star {
  Star(this.x, this.y, this.size, this.speed);
  double x;
  double y;
  final double size;
  final double speed;
}

class GamePage extends StatefulWidget {
  const GamePage({super.key});

  @override
  State<GamePage> createState() => _GamePageState();
}

class _GamePageState extends State<GamePage> with SingleTickerProviderStateMixin {
  late final Ticker _ticker;
  final math.Random _random = math.Random();
  final List<Meteor> _meteors = [];
  final List<Star> _stars = [];

  Size _size = Size.zero;
  double _playerX = 0;
  double _elapsed = 0;
  double _spawnClock = 0;
  Duration _lastTick = Duration.zero;
  int _score = 0;
  int _best = 0;
  int _lives = 3;
  bool _running = false;
  bool _startedOnce = false;

  static const double playerRadius = 22;

  @override
  void initState() {
    super.initState();
    _ticker = createTicker(_tick)..start();
  }

  @override
  void dispose() {
    _ticker.dispose();
    super.dispose();
  }

  void _ensureStars() {
    if (_size == Size.zero || _stars.isNotEmpty) return;
    for (var i = 0; i < 75; i++) {
      _stars.add(Star(
        _random.nextDouble() * _size.width,
        _random.nextDouble() * _size.height,
        0.7 + _random.nextDouble() * 1.8,
        8 + _random.nextDouble() * 20,
      ));
    }
  }

  void _startGame() {
    setState(() {
      _meteors.clear();
      _score = 0;
      _lives = 3;
      _elapsed = 0;
      _spawnClock = 0;
      _playerX = _size.width / 2;
      _running = true;
      _startedOnce = true;
      _lastTick = Duration.zero;
    });
  }

  void _movePlayer(double x) {
    if (!_running || _size == Size.zero) return;
    setState(() {
      _playerX = x.clamp(playerRadius + 4, _size.width - playerRadius - 4).toDouble();
    });
  }

  void _tick(Duration now) {
    if (!mounted || _size == Size.zero) return;
    _ensureStars();

    if (_lastTick == Duration.zero) {
      _lastTick = now;
      return;
    }

    final rawDt = (now - _lastTick).inMicroseconds / 1000000.0;
    final dt = rawDt.clamp(0.0, 0.05).toDouble();
    _lastTick = now;

    for (final star in _stars) {
      star.y += star.speed * dt;
      if (star.y > _size.height) {
        star.y = 0;
        star.x = _random.nextDouble() * _size.width;
      }
    }

    if (_running) {
      _elapsed += dt;
      _spawnClock += dt;
      final interval = math.max(0.30, 0.82 - _elapsed * 0.006);
      while (_spawnClock >= interval) {
        _spawnClock -= interval;
        final radius = 12 + _random.nextDouble() * 17;
        _meteors.add(Meteor(
          x: radius + _random.nextDouble() * math.max(1.0, _size.width - radius * 2),
          y: -radius,
          radius: radius,
          speed: 150 + _random.nextDouble() * 95 + _elapsed * 1.7,
        ));
      }

      final playerY = _size.height - 74;
      final removed = <Meteor>[];
      for (final meteor in _meteors) {
        meteor.y += meteor.speed * dt;
        final dx = meteor.x - _playerX;
        final dy = meteor.y - playerY;
        final hitDistance = meteor.radius + playerRadius * 0.78;
        if (dx * dx + dy * dy < hitDistance * hitDistance) {
          removed.add(meteor);
          _lives--;
          if (_lives <= 0) {
            _running = false;
            _best = math.max(_best, _score);
            break;
          }
        } else if (meteor.y - meteor.radius > _size.height) {
          removed.add(meteor);
          _score++;
          _best = math.max(_best, _score);
        }
      }
      _meteors.removeWhere(removed.contains);
    }

    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: LayoutBuilder(
        builder: (context, constraints) {
          final next = Size(constraints.maxWidth, constraints.maxHeight);
          if (next != _size) {
            _size = next;
            if (_playerX == 0) _playerX = _size.width / 2;
            _stars.clear();
            _ensureStars();
          }

          return GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTapDown: (d) => _movePlayer(d.localPosition.dx),
            onPanStart: (d) => _movePlayer(d.localPosition.dx),
            onPanUpdate: (d) => _movePlayer(d.localPosition.dx),
            child: Stack(
              fit: StackFit.expand,
              children: [
                CustomPaint(
                  painter: GamePainter(
                    meteors: _meteors,
                    stars: _stars,
                    playerX: _playerX,
                    running: _running,
                  ),
                ),
                SafeArea(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(18, 12, 18, 20),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            _Pill(label: 'SCORE', value: '$_score'),
                            _Pill(label: 'BEST', value: '$_best'),
                            _Pill(label: 'LIVES', value: List.filled(_lives, '♥').join()),
                          ],
                        ),
                        const Spacer(),
                        if (!_running)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 26, vertical: 24),
                            decoration: BoxDecoration(
                              color: const Color(0xCC101426),
                              borderRadius: BorderRadius.circular(28),
                              border: Border.all(color: Colors.white.withValues(alpha: 0.13)),
                              boxShadow: const [
                                BoxShadow(blurRadius: 36, spreadRadius: 1, color: Color(0x66000000)),
                              ],
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text(
                                  'METEOR DODGE',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 30, fontWeight: FontWeight.w900, letterSpacing: 2),
                                ),
                                const SizedBox(height: 10),
                                Text(
                                  _startedOnce ? 'Score: $_score  •  Best: $_best' : 'Drag the ship. Dodge the meteors.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(color: Colors.white.withValues(alpha: 0.72), fontSize: 15),
                                ),
                                const SizedBox(height: 22),
                                FilledButton.icon(
                                  onPressed: _startGame,
                                  icon: const Icon(Icons.play_arrow_rounded),
                                  label: Text(_startedOnce ? 'PLAY AGAIN' : 'START'),
                                  style: FilledButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 15),
                                    textStyle: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: 1.2),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        const Spacer(),
                        if (_running)
                          Text(
                            'DRAG TO MOVE',
                            style: TextStyle(
                              fontSize: 11,
                              letterSpacing: 2,
                              color: Colors.white.withValues(alpha: 0.42),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _Pill extends StatelessWidget {
  const _Pill({required this.label, required this.value});
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(minWidth: 86),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
      decoration: BoxDecoration(
        color: const Color(0x7711162A),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(fontSize: 9, letterSpacing: 1.5, color: Colors.white.withValues(alpha: 0.48)),
          ),
          const SizedBox(height: 2),
          Text(value, maxLines: 1, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
        ],
      ),
    );
  }
}

class GamePainter extends CustomPainter {
  GamePainter({required this.meteors, required this.stars, required this.playerX, required this.running});
  final List<Meteor> meteors;
  final List<Star> stars;
  final double playerX;
  final bool running;

  @override
  void paint(Canvas canvas, Size size) {
    final bg = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFF060714), Color(0xFF10122A), Color(0xFF071022)],
      ).createShader(Offset.zero & size);
    canvas.drawRect(Offset.zero & size, bg);

    final glow = Paint()
      ..shader = RadialGradient(
        colors: [const Color(0xFF5D55FF).withValues(alpha: 0.22), Colors.transparent],
      ).createShader(
        Rect.fromCircle(center: Offset(size.width * .18, size.height * .18), radius: size.width * .8),
      );
    canvas.drawRect(Offset.zero & size, glow);

    final starPaint = Paint()..color = Colors.white;
    for (final star in stars) {
      starPaint.color = Colors.white.withValues(alpha: 0.35 + star.size / 5);
      canvas.drawCircle(Offset(star.x, star.y), star.size, starPaint);
    }

    for (final meteor in meteors) {
      final c = Offset(meteor.x, meteor.y);
      final tail = Paint()
        ..strokeWidth = meteor.radius * 0.65
        ..strokeCap = StrokeCap.round
        ..shader = LinearGradient(
          colors: [const Color(0x00FF8A4C), const Color(0xAAFF6B35)],
        ).createShader(Rect.fromPoints(Offset(c.dx, c.dy - meteor.radius * 4.2), c));
      canvas.drawLine(Offset(c.dx, c.dy - meteor.radius * 3.7), c, tail);

      final meteorPaint = Paint()
        ..shader = const RadialGradient(
          colors: [Color(0xFFFFD166), Color(0xFFFF6B35), Color(0xFF9C2B22)],
        ).createShader(Rect.fromCircle(center: c, radius: meteor.radius));
      canvas.drawCircle(c, meteor.radius, meteorPaint);
      canvas.drawCircle(
        c.translate(-meteor.radius * .24, -meteor.radius * .18),
        meteor.radius * .18,
        Paint()..color = const Color(0x663A1010),
      );
    }

    final playerY = size.height - 74;
    final ship = Path()
      ..moveTo(playerX, playerY - 25)
      ..lineTo(playerX - 20, playerY + 20)
      ..lineTo(playerX, playerY + 12)
      ..lineTo(playerX + 20, playerY + 20)
      ..close();

    final shipGlow = Paint()
      ..color = const Color(0x665CC8FF)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 16);
    canvas.drawCircle(Offset(playerX, playerY), 28, shipGlow);

    final shipPaint = Paint()
      ..shader = const LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0xFFEAF8FF), Color(0xFF52C7FF), Color(0xFF4858FF)],
      ).createShader(Rect.fromCenter(center: Offset(playerX, playerY), width: 45, height: 55));
    canvas.drawPath(ship, shipPaint);

    if (running) {
      final flame = Path()
        ..moveTo(playerX - 7, playerY + 16)
        ..quadraticBezierTo(playerX, playerY + 36, playerX + 7, playerY + 16)
        ..close();
      canvas.drawPath(flame, Paint()..color = const Color(0xFFFFC857));
    }
  }

  @override
  bool shouldRepaint(covariant GamePainter oldDelegate) => true;
}
