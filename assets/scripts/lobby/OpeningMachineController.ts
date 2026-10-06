import {
  _decorator,
  Component,
  director,
  Node,
  Quat,
  tween,
  Vec3,
} from 'cc';

const { ccclass, property } = _decorator;

@ccclass('OpeningMachineController')
export class OpeningMachineController extends Component {
  @property(Node)
  cabinet: Node | null = null;

  @property(Node)
  cameraRig: Node | null = null;

  @property
  rotateDegreesPerSecond = 10;

  @property
  gameplaySceneName = 'Pinball2D';

  @property
  transitionSeconds = 1.35;

  private entering = false;

  onEnable(): void {
    this.node.on(Node.EventType.TOUCH_END, this.enterGame, this);
  }

  onDisable(): void {
    this.node.off(Node.EventType.TOUCH_END, this.enterGame, this);
  }

  update(dt: number): void {
    if (!this.cabinet || this.entering) {
      return;
    }

    const euler = this.cabinet.eulerAngles;
    this.cabinet.setRotationFromEuler(
      euler.x,
      euler.y + this.rotateDegreesPerSecond * dt,
      euler.z,
    );
  }

  public enterGame(): void {
    if (this.entering) {
      return;
    }
    this.entering = true;

    const target = this.cameraRig ?? this.node;
    const startScale = target.scale.clone();

    tween(target)
      .to(
        this.transitionSeconds,
        {
          scale: new Vec3(
            startScale.x * 1.16,
            startScale.y * 1.16,
            startScale.z * 1.16,
          ),
        },
        { easing: 'quadInOut' },
      )
      .call(() => {
        director.loadScene(this.gameplaySceneName);
      })
      .start();
  }
}
