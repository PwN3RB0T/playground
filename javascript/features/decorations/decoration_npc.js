// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { Vector } from 'base/vector.js';

import { random } from 'base/random.js';

// How many seconds should we wait before reconnecting a non-player character?
export const kReconnectionDelaySec = 30;

// Encapsulates the behaviour for an NPC that's been loaded as a decoration. These have more complex
// lifetime and state management that involves maintaining the connection, and potentially other
// entities by form of decoration as well.
export class DecorationNpc {
    information_ = null;

    entities_ = null;
    npc_ = null;
    token_ = null;
    vehicle_ = null;

    constructor(information) {
        this.information_ = information;
    }

    // Enables the NPC, creating entities off the |entities| set. This creates the NPC itself, keeps
    // it connected whilst its meant to be there, and maintains the special effects.
    enable(entities) {
        if (this.entities_ !== null)
            throw new Error(`This NPC has already been enabled, cannot double enable them!`);

        this.entities_ = entities;
        this.npc_ = entities.createNpc({
            name: this.information_.name,
            pawnScript: this.information_.script,
            events: this,
        });

        this.token_ = Symbol('unique NPC token');
    }

    // ---------------------------------------------------------------------------------------------

    // Called when the |npc| has connected to the server.
    onNpcConnected(npc) {
        if (!this.entities_)
            return;  // |this| NPC has been disabled, so is no longer needed

        this.vehicle_ = this.createVehicle();
    }

    // Called when the |npc| spawns in the world. We'll want them to move to the right Virtual
    // World and put them in a vehicle - if any.
    onNpcSpawn(npc) {
        npc.player.virtualWorld = 0;

        if (this.vehicle_)
            npc.player.enterVehicle(this.vehicle_);
    }

    // Called when the |npc| has disconnected from the server. If we're still enabled, then a new
    // connection will be initialized automagically after a brief period of time to get them back.
    onNpcDisconnected(npc) {
        if (!this.entities_)
            return;  // |this| NPC has been disabled, so is no longer needed
        
        const token = this.token_;

        if (this.vehicle_) {
            this.vehicle_.dispose();
            this.vehicle_ = null;
        }

        if (!server.isTest())
            console.log(`[npc] ${npc.name} disconnected. Waiting for reconnect.`);

        wait(kReconnectionDelaySec * 1000).then(() => {
            if (!this.entities_ || this.token_ !== token)
                return;  // |this| has been disabled in the interim.
            
            if (!server.isTest())
                console.log(`[npc] Reconnecting ${npc.name}...`);

            this.npc_ = this.entities_.createNpc({
                name: this.information_.name,
                pawnScript: this.information_.script,
                events: this,
            });
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Creates a vehicle for the NPC to drive in, based on the configuration. If the configuration
    // is missing or invalid, NULL will be returned instead.
    createVehicle() {
        if (!this.information_.hasOwnProperty('appearance'))
            return null;  // no appearance has been defined
        
        if (!this.information_.appearance.hasOwnProperty('vehicle'))
            return null;  // no vehicle appearance has been defined

        const settings = this.information_.appearance.vehicle;

        if (!settings.hasOwnProperty('modelId') || typeof settings.modelId !== 'number')
            throw new Error(`Invalid vehicle model given for NPC ${this.information_.name}.`);
        
        return this.entities_.createVehicle({
            modelId: settings.modelId,
            position: new Vector(...this.information_.position),
            rotation: this.information_.rotation,
            primaryColor: settings.primaryColor ?? random(124),
            secondaryColor: settings.secondaryColor ?? random(124),
            numberPlate: this.information_.name,
        });
    }

    // ---------------------------------------------------------------------------------------------

    // Disables the NPC. The created entities will be deleted automatically hereafter, but there
    // might be additional state that has to be cleaned up.
    disable() {
        this.entities_ = null;
        this.npc_ = null;
        this.vehicle_ = null;
    }
}
