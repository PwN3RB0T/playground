// Copyright 2016 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

import { AbuseDetectors } from 'features/abuse/abuse_detectors.js';
import { AbuseEventListener } from 'features/abuse/abuse_event_listener.js';
import { AbuseMonitor } from 'features/abuse/abuse_monitor.js';
import { Feature } from 'components/feature_manager/feature.js';

// Implementation of the feature that keep track of whether a player is abusing. It tracks the
// fighting activities of a player and applies limitations based on area policies.
class Abuse extends Feature {
    constructor() {
        super();

        // The announce feature enables abuse to be reported to administrators.
        this.announce_ = this.defineDependency('announce');

        // The settings for the Abuse system are configurable at runtime.
        this.settings_ = this.defineDependency('settings');

        this.monitor_ = new AbuseMonitor(this.announce_, this.settings_);
        this.detectors_ = new AbuseDetectors(this.settings_, this.monitor_);

        // Responsible for listening to SA-MP events and forwarding those to the mitigator and
        // enabled abuse detectors. Does minimal pre-processing itself.
        this.eventListener_ = new AbuseEventListener(this.detectors_);
    }

    // ---------------------------------------------------------------------------------------------

    dispose() {
        this.eventListener_.dispose();
        this.eventListener_ = null;

        this.monitor_.dispose();
        this.monitor_ = null;
    }
}

export default Abuse;
