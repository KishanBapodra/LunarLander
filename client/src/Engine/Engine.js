import { EVENTS } from '../../../shared/Consts';
import Resource from '../Objects/Resource';
import Player from '../Objects/Player';
import Terrain from '../Objects/Terrain';

import sprite_rechargeStation from '../Assets/Misc/RechargeStation/RechargeStation.webm';
import sprite_ships from '../Assets/Misc/Ships/Ships.webm';
import sprite_deadPlayers from '../Assets/drone/drone-3.png';

import NameTag from '../Objects/NameTag';

// Class Representing the Engine
export default class Engine {
	constructor(renderer, me, socket) {
		this.d0 = Date.now();

		this.socket = socket;
		this.renderer = renderer;
		this.me = me;
		this.isAnchored = false;

		this.terrain = [];
		this.offset = 0;
		this.pOffset = -1;

		this.players = {};

		this.ships = [];
		this.rechargeStations = [];
		this.deadPlayers = [];

		this.radar = null;
		this.currentResource = null;
	}

	addNodes(nodes, layers) {
		nodes.forEach((n, i) => {
			if (layers[i] === 'Terrain') {
				this.terrain.push(n);
			}
			if (layers[i] === 'Players') {
				this.players[n.name] = n;
			}
			this.renderer.addNode(layers[i], n);
		});
	}

	control(verb, socket) {
		switch (verb) {
			case 'TOGGLE-TAGS': {
				const layer = this.renderer.getLayer('NameTags');
				layer.isHidden ? layer.show() : layer.hide();
				return true;
			}

			case 'FIRE': {
				if (this.players[this.me]) {
					[this.players[this.me].fire()];
				}
				socket.emit(EVENTS.PLAYER_HAS_SHOT);
				return true;
			}

			case 'SELF-DESTRUCT':
				this.damagePlayer(this.me, 10000);
				return true;

			default:
				break;
		}
	}

	getNode(name) {
		return this.renderer.getNode(name);
	}

	getVelocity() {
		if (this.players[this.me]) {
			return this.players[this.me].velocity;
		}
	}

	getSystems() {
		if (this.players[this.me]) {
			return {
				fuel: this.players[this.me].resources.fuel,
				health: this.players[this.me].health,
			};
		}
	}

	getResources() {
		if (this.players[this.me]) {
			return {
				W: this.players[this.me].resources.W,
				scrap: this.players[this.me].resources.scrap,
				val: this.players[this.me].value,
			};
		}
	}

	getRadarInterrupt() {
		return this.radar.getInterrupt();
	}

	setRadarInterrupt(val) {
		this.radar.setInterrupt(val);
	}

	damagePlayer(id, val) {
		this.socket.emit(EVENTS.PLAYER_HAS_DAMAGED, { id, val });
	}

	setAnchor(anchor) {
		this.isAnchored = true;
		this.renderer.setAnchor(anchor);
	}

	setRadar(radar) {
		this.radar = radar;
	}

	setRaderText(text) {
		this.radar.setRaderText(text);
	}

	getRaderText() {
		return this.radar.getText();
	}

	setCurrentResource(resource) {
		this.currentResource = resource;
	}

	getCurrentResource() {
		return this.currentResource;
	}

	explodePlayer(callback) {
		if (this.players[this.me]) this.players[this.me].explode(callback);
	}

	addRechargeStation(resources) {
		this.radar.setRechargeStations(resources);
		this.rechargeStations.forEach((s, i) => {
			this.renderer.removeNode(`Resources-${s.name}`);
			this.renderer.removeNode(`NameTags-${s.name}`);
		});

		this.rechargeStations = resources;

		resources.forEach((s, i) => {
			this.addNodes(
				[
					new Resource({
						id: s.id,
						name: `${s.name}`,
						position: {
							x: s.xPosition + window.innerWidth / 2 - 60,
							y: Terrain.sample(s.xPosition, this.offset) - 60,
						},
						hitbox: {
							w: 60,
							h: 60,
						},
						resources: s.resources,
						setCurrentResource: this.setCurrentResource.bind(this),
						setRAderText: this.setRaderText.bind(this),
						getRaderText: this.getRaderText.bind(this),
						getRadarInterrupt: this.getRadarInterrupt.bind(this),
						scale: 3,
						zIndex: 11,
						sprite: sprite_rechargeStation,
						type: 'gif',
					}),
					new NameTag({
						name: `${s.name}`,
						color: '#eeedab',
						string: `
							<div>
								<div>${s.name}</div>
								<div>&emsp;{</div>
								<div>&emsp;&emsp;Fuel: ${s.resources.fuel}</div>
								<div>&emsp;&emsp;W: ${s.resources.W}</div>
								<div>&emsp;}</div>
							</div>
						`,
						position: {
							x: s.xPosition + window.innerWidth / 2 + 60,
							y: Terrain.sample(s.xPosition, this.offset) - 110,
						},
					}),
				],
				['Resources', 'NameTags']
			);

			this.radar.addDot(s.xPosition, this.players[this.me].position.x);
		});
	}

	addShips(resources) {
		this.radar.setShips(resources);
		this.ships.forEach((s, i) => {
			this.renderer.removeNode(`Resources-${s.name}`);
			this.renderer.removeNode(`NameTags-${s.name}`);
		});

		this.ships = resources;

		resources.forEach((s, i) => {
			this.addNodes(
				[
					new Resource({
						id: s.id,
						name: `${s.name}`,
						position: {
							x: s.xPosition + window.innerWidth / 2 - 300,
							y: Terrain.sample(s.xPosition, this.offset) - 300,
						},
						hitbox: {
							w: 300,
							h: 300,
						},
						resources: s.resources,
						setCurrentResource: this.setCurrentResource.bind(this),
						setRAderText: this.setRaderText.bind(this),
						getRaderText: this.getRaderText.bind(this),
						getRadarInterrupt: this.getRadarInterrupt.bind(this),
						size: {
							w: 100,
							h: 100,
						},
						scale: 5,
						rotation: -0.5 + Math.random() * 0.2,
						zIndex: 10,
						sprite: sprite_ships,
						type: 'gif',
					}),
					new NameTag({
						name: `${s.name}`,
						color: '#abeeab',
						string: `
							<div>
								<div>${s.name}</div>
								<div>&emsp;{</div>
								<div>&emsp;&emsp;Fuel: ${s.resources.fuel}</div>
								<div>&emsp;&emsp;W: ${s.resources.W}</div>
								<div>&emsp;}</div>
							</div>
						`,
						position: {
							x: s.xPosition + window.innerWidth / 2 + 30,
							y: Terrain.sample(s.xPosition, this.offset) - 180,
						},
					}),
				],
				['Resources', 'NameTags']
			);

			this.radar.addDot(s.xPosition, this.players[this.me].position.x);
		});
	}

	addDeadPlayers(resources) {
		this.radar.setShips(resources);
		this.deadPlayers.forEach((s, i) => {
			this.renderer.removeNode(`Resources-Player-${s.name}`);
			this.renderer.removeNode(`NameTags-${s.name}`);
		});

		this.deadPlayers = resources;

		resources.forEach((s, i) => {
			this.addNodes(
				[
					new Resource({
						id: s.uuid,
						name: `Player-${s.name}`,
						position: {
							x: s.xPosition + window.innerWidth / 2,
							y: Terrain.sample(s.xPosition, this.offset) - 20,
						},
						hitbox: {
							w: 0,
							h: 20,
						},
						resources: s.resources,
						setCurrentResource: this.setCurrentResource.bind(this),
						setRAderText: this.setRaderText.bind(this),
						getRaderText: this.getRaderText.bind(this),
						getRadarInterrupt: this.getRadarInterrupt.bind(this),
						size: {
							w: 0,
							h: 0,
						},
						scale: 5,
						rotation: -0.5 + Math.random() * 0.2,
						zIndex: 10,
						sprite: sprite_deadPlayers,
					}),
					new NameTag({
						name: `${s.name}`,
						color: '#abeeab',
						string: `
							<div>
								<div>${s.name}</div>
								<div>&emsp;{</div>
								<div>&emsp;&emsp;Fuel: ${s.resources.fuel}</div>
								<div>&emsp;&emsp;W: ${s.resources.W}</div>
								<div>&emsp;}</div>
							</div>
						`,
						position: {
							x: s.xPosition + window.innerWidth / 2 + 30,
							y: Terrain.sample(s.xPosition, this.offset) - 150,
						},
					}),
				],
				['Resources', 'NameTags']
			);

			this.radar.addDot(s.xPosition, this.players[this.me].position.x);
		});
	}

	/**
	 * Updates current list of players with a new list of Players.
	 * @param {Array<Object>} players Array of players to update current list of players with.
	 */
	updatePlayers(players) {
		Object.values(this.players).forEach((p) => {
			if (p.nameTag) {
				this.renderer.removeNode(`NameTags-${p.name}`);
			}

			p.removeDomNode();
			this.renderer.removeNode(p.name);
		});

		this.players = {};

		let radarPlayers = [];
		let nameTag = null;
		players.forEach((p) => {
			if (p.id !== this.me) {
				radarPlayers.push(p);

				nameTag = new NameTag({
					name: `${p.id}`,
					color: '#eeabab',
					string: `
					<div>
						<div>${p.name}</div>
						<div>&emsp;{</div>
						<div>&emsp;&emsp;Value: ${p.value}</div>
						<div>&emsp;}</div>
					</div>
					`,
					position: {
						x: p.position.x + window.innerWidth / 2,
						y: p.position.y - 70,
					},
				});
			}

			this.addNodes(
				[
					new Player({
						usrname: p.name,
						id: p.id,
						position: p.position,
						rotation: p.rotation,
						velocity: p.velocity,
						health: p.health,
						nameTag: nameTag,
						fire: p.fire,
						resources: p.resources,
						value: p.value,
						getPlayers: () => this.players,
						getSocket: () => this.socket,
						damagePlayer: this.damagePlayer.bind(this),
					}),
				],
				['Players']
			);

			if (nameTag) {
				this.addNodes([nameTag], ['NameTags']);
			}
		});

		this.radar.setPlayers(radarPlayers);
		this.setAnchor(`Players-${this.players[this.me].name}`);
	}

	updatePlayer(player) {
		let radarPlayers = this.radar.players;
		if (player.id !== this.me) {
			if (this.players[player.id]) {
				this.players[player.id].transform({
					position: {
						x: player.position.x + window.innerWidth / 2,
						y: player.position.y,
					},
					rotation: player.rotation,
				});

				this.players[player.id].nameTag.transform({
					position: {
						x: player.position.x + window.innerWidth / 2,
						y: player.position.y - 70,
					},
					rotation: 0,
				});
				if (player.fire !== 0) {
					for (let i = 0; i < player.fire; i++) {
						this.players[player.id].fire();
					}
				}
			}

			radarPlayers = this._removeByAttr(radarPlayers, 'id', player.id);
			radarPlayers.push(player);
		} else {
			if (this.players[player.id]) {
				this.players[player.id].transform({
					position: player.position,
					rotation: player.rotation,
				});

				this.players[player.id].setVelocity(player.velocity);
				this.players[player.id].setResources({
					resources: player.resources,
					health: player.health,
				});
			}
		}

		if (this.players[player.id]) {
			this.players[player.id].setNameTag(player.value);
			this.players[player.id].setBoostState(player.movementState);
		}
	}

	update() {
		const dt = this._tick() / 1000;
		this.dt = dt;
		if (this.isAnchored) {
			const me = this.players[this.me];
			this.offset = me.position.x;

			if (this.pOffset !== this.offset) {
				this.terrain[0].needsUpdate = true;
				this.terrain[1].needsUpdate = true;
				this.pOffset = this.offset;
			}
		}

		this.terrain.forEach((t) => {
			if (t.needsUpdate) {
				t.drawTerrain(this.offset);
				t.needsUpdate = false;
			}
		});

		this.renderer.render(this.offset);
	}

	/**
	 * @private Used to calculate delta-time (dt, time between consecutive ticks)
	 */
	_tick() {
		var now = Date.now();
		var dt = now - this.d0;
		this.d0 = now;
		return dt;
	}

	_removeByAttr(arr, attr, value) {
		var i = arr.length;
		while (i--) {
			if (
				arr[i] &&
				arr[i].hasOwnProperty(attr) &&
				arguments.length > 2 &&
				arr[i][attr] === value
			) {
				arr.splice(i, 1);
			}
		}
		return arr;
	}
}
