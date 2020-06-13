// Copyright 2020 Las Venturas Playground. All rights reserved.
// Use of this source code is governed by the MIT license, a copy of which can
// be found in the LICENSE file.

// Provides an actual view on a player's statistics. Three variants of this object are possible: the
// statistics for the active playing session, a player's account statistics spanning multiple
// playing sessions, and a diff view when snapshots are taken.
export class PlayerStatsView {
    // Properties that should be ignored when serializing the view.
    static kIgnoredProperties = new Set(['ratio']);

    deathCount = 0;
    killCount = 0;

    // Gets the kills/deaths ratio based on the data in this view.
    get ratio() { return this.deathCount ? this.killCount / this.deathCount : this.killCount; }
}
