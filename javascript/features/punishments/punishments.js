// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import Feature from 'components/feature_manager/feature.js';

import { BanDatabase } from 'features/punishments/ban_database.js';
import { MockBanDatabase } from 'features/punishments/test/mock_ban_database.js';
import { NuwaniCommands } from 'features/punishments/nuwani_commands.js';

// Provides a series of commands related to punishing players.
export default class Punishments extends Feature {
    announce_ = null;
    nuwani_ = null;

    database_ = null;
    nuwaniCommands_ = null;

    constructor() {
        super();

        // Actions will have to be reported to other administrators.
        this.announce_ = this.defineDependency('announce');

        // This feature provides commands to Nuwani, so will have to depend on it.
        this.nuwani_ = this.defineDependency('nuwani');
        this.nuwani_.addReloadObserver(this, () => this.initializeNuwaniCommands());

        // The database instance powering MySQL interactions for this feature. Will be mocked out
        // for testing, as we don't want tests reaching the actual database.
        this.database_ = server.isTest() ? new MockBanDatabase()
                                         : new BanDatabase();

        this.initializeNuwaniCommands();
    }

    // Initializes the Nuwani commands. Done in a separate method to be able to cope with the
    // `nuwani` feature reloading itself.
    initializeNuwaniCommands() {
        this.nuwaniCommands_ = new NuwaniCommands(
            this.nuwani_().commandManager, this.announce_, this.database_);
    }

    dispose() {
        this.nuwaniCommands_.dispose();
        this.nuwaniCommands_ = null;

        this.database_ = null;
    }
}
