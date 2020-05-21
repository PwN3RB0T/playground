// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { GameObject } from 'entities/game_object.js';

// Global counter for creating a unique mocked object ID.
let globalMockObjectId = 0;

// Mocked version of the GameObject, which represents objects created in the world of San Andreas.
// Overrides all functionality that would end up calling into Pawn and/or the streamer plugin.
export class MockGameObject extends GameObject {
    #id_ = null;

    #position_ = null;
    #rotation_ = null;

    #moveResolver_ = null;

    // Overridden to avoid creating a real object on the server.
    createInternal(options) {
        this.#position_ = options.position;
        this.#rotation_ = options.rotation;

        this.#id_ = ++globalMockObjectId;

        return this.#id_;
    }

    // Overridden to avoid destroying a real object on the server.
    destroyInternal() {}

    // ---------------------------------------------------------------------------------------------

    get position() { return this.#position_; }
    set position(value) { this.#position_ = value; }

    get rotation() { return this.#rotation_; }
    set rotation(value) { this.#rotation_ = value; }

    // ---------------------------------------------------------------------------------------------

    attachToVehicle(vehicle, offset, rotation) {}

    // ---------------------------------------------------------------------------------------------

    async moveTo(position, speed) {
        return new Promise(resolve => {
            this.#moveResolver_ = resolve;

            server.objectManager.onObjectMoved({
                objectid: this.#id_
            });
        });
    }

    // ---------------------------------------------------------------------------------------------

    onMoved() {
        if (!this.#moveResolver_)
            return;
        
        this.#moveResolver_();
        this.#moveResolver_ = null;
    }
}