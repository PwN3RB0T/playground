// Copyright 2017 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

const ChannelSelection = require('features/radio/channel_selection.js');
const MockAnnounce = require('features/announce/test/mock_announce.js');
const RadioManager = require('features/radio/radio_manager.js');

describe('RadioManager', (it, beforeEach, afterEach) => {
    let gunther = null;
    let manager = null;
    let selection = null;
    let settings = null;
    let vehicle = null;

    beforeEach(() => {
        settings = server.featureManager.loadFeature('settings');

        const announce = new MockAnnounce();

        selection = new ChannelSelection(() => announce, () => settings);
        selection.loadConfigurationFromArray([
            {
                name: "LVP Radio",
                stream: "https://play.sa-mp.nl/stream.pls"
            }
        ]);

        manager = new RadioManager(selection, () => settings);

        gunther = server.playerManager.getById(0 /* Gunther */);
        gunther.identify();

        vehicle = server.vehicleManager.createVehicle({
            modelId: 411 /* Infernus */,
            position: new Vector(1000, 1500, 10)
        });
    });

    afterEach(() => {
        manager.dispose();
        selection.dispose();
    });

    it('should keep track of whether the feature is enabled', assert => {
        assert.isTrue(settings.getValue('radio/enabled'));
        assert.isTrue(manager.isEnabled());

        settings.setValue('radio/enabled', false);

        assert.isFalse(settings.getValue('radio/enabled'));
        assert.isFalse(manager.isEnabled());
    });

    it('should be able to start and stop the radio for a player', assert => {
        assert.isTrue(settings.getValue('radio/enabled'));
        assert.isTrue(manager.isEnabled());

        assert.isFalse(manager.isListening(gunther));
        assert.isNull(gunther.streamUrl);

        manager.startRadio(gunther);
        assert.isTrue(manager.isListening(gunther));
        assert.equal(gunther.streamUrl, selection.defaultChannel.stream);

        manager.stopRadio(gunther);
        assert.isFalse(manager.isListening(gunther));
        assert.isNull(gunther.streamUrl);
    });

    it('should start the radio when a player enters a vehicle', assert => {
        assert.isTrue(settings.getValue('radio/enabled'));
        assert.isTrue(manager.isEnabled());

        assert.isFalse(manager.isListening(gunther));
        assert.isFalse(manager.isEligible(gunther));
        assert.isNull(gunther.streamUrl);

        // Enter the vehicle as a driver.
        {
            gunther.enterVehicle(vehicle, 0 /* driver seat */);
            assert.isTrue(manager.isListening(gunther));
            assert.isTrue(manager.isEligible(gunther));
            assert.equal(gunther.streamUrl, selection.defaultChannel.stream);

            gunther.leaveVehicle();
            assert.isFalse(manager.isListening(gunther));
            assert.isFalse(manager.isEligible(gunther));
            assert.isNull(gunther.streamUrl);
        }

        // Enter the vehicle as a passenger.
        {
            gunther.enterVehicle(vehicle, 1 /* passenger seat */);
            assert.isTrue(manager.isListening(gunther));
            assert.isTrue(manager.isEligible(gunther));
            assert.equal(gunther.streamUrl, selection.defaultChannel.stream);

            gunther.leaveVehicle();
            assert.isFalse(manager.isListening(gunther));
            assert.isFalse(manager.isEligible(gunther));
            assert.isNull(gunther.streamUrl);
        }
    });

    it('should not start the radio when entering a vehicle w/o the feature enabled', assert => {
        assert.isTrue(settings.getValue('radio/enabled'));
        assert.isTrue(manager.isEnabled());

        settings.setValue('radio/enabled', false);

        assert.isFalse(manager.isListening(gunther));

        // Enter the vehicle as a driver.
        {
            gunther.enterVehicle(vehicle, 0 /* driver seat */);
            assert.isFalse(manager.isListening(gunther));
            assert.isNull(gunther.streamUrl);
        }
    });

    it('should enable management to override the in-vehicle restrictions', assert => {
        assert.isNull(gunther.vehicle);

        assert.isTrue(settings.getValue('radio/restricted_to_vehicles'));
        assert.isFalse(manager.isEligible(gunther));

        settings.setValue('radio/restricted_to_vehicles', false);

        assert.isFalse(settings.getValue('radio/restricted_to_vehicles'));
        assert.isTrue(manager.isEligible(gunther));
    });
});
